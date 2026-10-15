data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# The landing zone owns the Route 53 zones. This configuration reads the osbornesupremacy.com zone
# from it and owns only its own records in that zone, as ses-ui does.
data "terraform_remote_state" "lz" {
  backend = "s3"

  config = {
    bucket       = "bro-tfstate"
    key          = "lz"
    region       = "us-east-1"
    use_lockfile = true
  }
}
