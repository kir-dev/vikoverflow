build:
	GOOS=linux GOARCH=amd64 go build -o ./build/es-indexer-lambda es-indexer-lambda.go

deploy: build
	terraform apply --auto-approve

destroy:
	terraform destroy --auto-approve