// build with:
// GOOS=linux GOARCH=amd64 go build -o ../build/es-indexer-lambda es-indexer-lambda.go

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/elastic/go-elasticsearch"
	"github.com/elastic/go-elasticsearch/esapi"
	"go.uber.org/zap"
)

var logger *zap.Logger
var es *elasticsearch.Client
var domain = os.Getenv("ES_DOMAIN")
var index = os.Getenv("ES_INDEX")
var username = os.Getenv("ES_USER")
var password = os.Getenv("ES_PASSWORD")

func init() {
	var err error

	logger, err = zap.NewProduction()

	if err != nil {
		log.Fatalf("error setting up logger: %v", err)
	}

	es, err = elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{
			domain,
		},
		Username: username,
		Password: password,
	})

	if err != nil {
		log.Fatalf("error creating es client: %v", err)
	}
}

func shouldBeIndexed(record events.DynamoDBEventRecord) bool {
	t := strings.ToLower(strings.Split(record.Change.Keys["SK"].String(), "#")[0])

	switch t {
	case "question", "answer", "topic", "user":
		return true
	default:
		return false
	}
}

func createDocumentID(record events.DynamoDBEventRecord) string {
	return fmt.Sprintf("%v|%v", strings.Replace(record.Change.Keys["PK"].String(), "#", "|", 1), strings.Replace(record.Change.Keys["SK"].String(), "#", "|", 1))
}

// UnmarshalStreamImage converts events.DynamoDBAttributeValue to struct
// events.DynamoDBAttributeValue -> JSON string -> Go struct w/ the dynamodb type of Attributevalues -> clean go struct
func unmarshalStreamImage(attribute map[string]events.DynamoDBAttributeValue, out interface{}) error {
	dbAttrMap := make(map[string]*dynamodb.AttributeValue)

	for k, v := range attribute {

		var dbAttr dynamodb.AttributeValue

		bytes, marshalErr := v.MarshalJSON()
		if marshalErr != nil {
			return marshalErr
		}

		err := json.Unmarshal(bytes, &dbAttr)
		if err != nil {
			return err
		}
		dbAttrMap[k] = &dbAttr
	}

	return dynamodbattribute.UnmarshalMap(dbAttrMap, out)
}

func getESBodyFromDynamoRecord(record events.DynamoDBEventRecord) ([]byte, error) {
	rawBody := make(map[string]interface{})
	body := make(map[string]interface{})
	err := unmarshalStreamImage(record.Change.NewImage, &rawBody)

	if err != nil {
		return nil, errors.New("error unmarshalling record: " + err.Error())
	}

	t := strings.ToLower(strings.Split(rawBody["SK"].(string), "#")[0])
	id := strings.Split(rawBody["SK"].(string), "#")[1]

	switch t {
	case "topic":
		{
			body["type"] = t
			body["id"] = id
			break
		}
	case "question":
		{
			body["type"] = t
			body["id"] = id
			body["title"] = rawBody["title"]
			body["body"] = rawBody["body"]
			body["topics"] = rawBody["topics"]
			body["createdAt"] = rawBody["createdAt"]
			body["upvotes"] = rawBody["upvotes"]
			body["creator"] = rawBody["creator"]
			body["numberOfAnswers"] = rawBody["numberOfAnswers"]
			break
		}
	case "answer":
		{
			body["type"] = t
			body["id"] = id
			body["questionId"] = strings.Split(rawBody["PK"].(string), "#")[1]
			body["body"] = rawBody["body"]
			break
		}
	case "user":
		{
			body["type"] = t
			body["id"] = id
			body["name"] = rawBody["name"]
			break
		}
	default:
		return nil, errors.New("unknown record type")
	}

	b, err := json.Marshal(body)

	if err != nil {
		return nil, errors.New("error marshalling record: " + err.Error())
	}

	return b, nil
}

func indexRecord(record events.DynamoDBEventRecord, logger *zap.Logger) error {
	documentID := createDocumentID(record)

	ctx := logger.With(zap.String("documentID", documentID))

	esBody, err := getESBodyFromDynamoRecord(record)

	if err != nil {
		ctx.Error("error getting es body from dynamo record", zap.Error(err))
		return err
	}

	ctx = ctx.With(zap.ByteString("esBody", esBody))

	req := esapi.IndexRequest{
		Index:      index,
		DocumentID: documentID,
		Body:       bytes.NewReader(esBody),
	}

	res, err := req.Do(context.Background(), es)

	if err != nil {
		ctx.Error("es request error", zap.Error(err))
		return err
	}

	defer res.Body.Close()

	if res.IsError() {
		ctx.Error("es response error")
		return errors.New("es response error")
	}

	ctx.Info("indexed")
	return nil
}

func removeRecord(record events.DynamoDBEventRecord, logger *zap.Logger) error {
	documentID := createDocumentID(record)

	ctx := logger.With(zap.String("documentID", documentID))

	req := esapi.DeleteRequest{
		Index:      index,
		DocumentID: documentID,
	}

	res, err := req.Do(context.Background(), es)

	if err != nil {
		ctx.Error("es request error", zap.Error(err))
		return err
	}

	defer res.Body.Close()

	if res.IsError() {
		ctx.Error("es response error")
		return errors.New("es response error")
	}

	ctx.Info("removed")
	return nil
}

func handler(e events.DynamoDBEvent) error {
	defer logger.Sync()

	wg := &sync.WaitGroup{}
	errorChan := make(chan error)
	allRecordsDone := make(chan bool)

	for _, record := range e.Records {
		wg.Add(1)

		go func(record events.DynamoDBEventRecord) {
			defer wg.Done()

			ctx := logger.With(zap.Any("record", record))

			if shouldBeIndexed(record) == false {
				ctx.Info("skipped")
				return
			}

			switch record.EventName {
			case "REMOVE":
				if err := removeRecord(record, ctx); err != nil {
					errorChan <- err
				}
				return
			case "INSERT", "MODIFY":
				if err := indexRecord(record, ctx); err != nil {
					errorChan <- err
				}
				return
			}
		}(record)
	}

	go func() {
		wg.Wait()
		close(allRecordsDone)
	}()

	select {
	case <-allRecordsDone:
		return nil
	case err := <-errorChan:
		close(errorChan)
		return err
	}
}

func main() {
	lambda.Start(handler)
}
