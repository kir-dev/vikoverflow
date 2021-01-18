variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "dynamodb_table_name" {
  type    = string
  default = "vikoverflow"
}

variable "dynamodb_table_capacity" {
  type        = number
  description = "watch out, we have 3 indexes total so this values gets tripled"
  default     = 5
}

variable "s3_bucket_name" {
  type    = string
  default = "vikoverflow-user-uploads"
}

variable "es_domain_name" {
  type    = string
  default = "vikoverflow"
}

variable "es_index" {
  type    = string
  default = "prod"
}

variable "es_user" {
  type    = string
  default = "root"
}

variable "es_password" {
  type = string
}

