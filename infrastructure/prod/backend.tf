locals {
  build_folder_path = abspath("../build")
}

resource "aws_dynamodb_table" "dynamo_table" {
  name           = var.dynamodb_table_name
  billing_mode   = "PROVISIONED"
  write_capacity = var.dynamodb_table_capacity
  read_capacity  = var.dynamodb_table_capacity

  hash_key  = "PK"
  range_key = "SK"

  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    write_capacity  = var.dynamodb_table_capacity
    read_capacity   = var.dynamodb_table_capacity
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI2"
    hash_key        = "creator"
    range_key       = "createdAt"
    write_capacity  = var.dynamodb_table_capacity
    read_capacity   = var.dynamodb_table_capacity
    projection_type = "ALL"
  }

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "N"
  }

  attribute {
    name = "creator"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "N"
  }
}

resource "aws_s3_bucket" "user_uploads_bucket" {
  bucket        = var.s3_bucket_name
  force_destroy = true
  acl           = "public-read"
}

resource "aws_elasticsearch_domain" "es" {
  domain_name           = var.es_domain_name
  elasticsearch_version = "7.7"

  cluster_config {
    instance_type = "t3.small.elasticsearch"
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 10

  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-0-2019-07"
  }

  node_to_node_encryption {
    enabled = true
  }

  encrypt_at_rest {
    enabled = true
  }

  advanced_security_options {
    enabled                        = true
    internal_user_database_enabled = true
    master_user_options {
      master_user_name     = var.es_user
      master_user_password = var.es_password
    }
  }
}

resource "aws_elasticsearch_domain_policy" "es_domain_policy" {
  domain_name     = aws_elasticsearch_domain.es.domain_name
  access_policies = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": "es:*",
      "Resource": "${aws_elasticsearch_domain.es.arn}/*"
    }
  ]
}
POLICY
}

output "es_domain_endpoint" {
  value = "https://${aws_elasticsearch_domain.es.endpoint}"
}

data "archive_file" "es_indexer_lambda_zip" {
  type        = "zip"
  source_file = "${local.build_folder_path}/es-indexer-lambda"
  output_path = "${local.build_folder_path}/es-indexer-lambda.zip"
}

resource "aws_lambda_function" "es_indexer_lambda" {
  function_name    = "vikoverflow_es_indexer_lambda"
  role             = aws_iam_role.es_indexer_lambda_exec.arn
  runtime          = "go1.x"
  handler          = "es-indexer-lambda"
  filename         = data.archive_file.es_indexer_lambda_zip.output_path
  source_code_hash = base64sha256(data.archive_file.es_indexer_lambda_zip.output_path)

  environment {
    variables = {
      ES_DOMAIN   = "https://${aws_elasticsearch_domain.es.endpoint}",
      ES_INDEX    = var.es_index,
      ES_USER     = var.es_user,
      ES_PASSWORD = var.es_password,
    }
  }
}

resource "aws_iam_role" "es_indexer_lambda_exec" {
  name = "vikoverflow_es_indexer_lambda_exec_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

data "aws_iam_policy_document" "stream_policy_document" {
  statement {
    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams",
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      aws_dynamodb_table.dynamo_table.stream_arn,
      "arn:aws:logs:*:*:*"
    ]
  }
}

resource "aws_iam_policy" "stream_policy" {
  name   = "vikoverflow-stream-consumer"
  policy = data.aws_iam_policy_document.stream_policy_document.json
}

resource "aws_iam_role_policy_attachment" "stream_policy_attachment" {
  role       = aws_iam_role.es_indexer_lambda_exec.name
  policy_arn = aws_iam_policy.stream_policy.arn
}

resource "aws_lambda_event_source_mapping" "es_indexer_lambda_mapping" {
  event_source_arn               = aws_dynamodb_table.dynamo_table.stream_arn
  function_name                  = aws_lambda_function.es_indexer_lambda.arn
  starting_position              = "TRIM_HORIZON"
  batch_size                     = 100
  maximum_retry_attempts         = 100
  bisect_batch_on_function_error = true
}
