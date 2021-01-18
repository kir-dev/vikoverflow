variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "dynamodb_table_name" {
  type    = string
  default = "staging-vikoverflow"
}

variable "dynamodb_table_capacity" {
  type        = number
  description = "watch out, we have 3 indexes total so this values gets tripled"
  default     = 1
}

variable "s3_bucket_name" {
  type    = string
  default = "staging-vikoverflow-user-uploads"
}

variable "es_domain" {
  type        = string
  description = "domain of production deployment "
}

variable "es_index" {
  type    = string
  default = "staging"
}

variable "es_user" {
  type    = string
  default = "root"
}

variable "es_password" {
  type = string
}

