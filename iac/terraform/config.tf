provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "live"
      Application = "flags-of-the-world"
      ManagedBy   = "terraform"
      Owner       = "flags@osbornesupremacy.com"
    }
  }
}

terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }

  backend "s3" {
    bucket       = "bro-tfstate"
    use_lockfile = true
    key          = "flags-of-the-world"
    region       = "us-east-1"
  }
}
