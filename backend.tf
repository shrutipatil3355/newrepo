terraform {
  backend "s3" {
    bucket         = "shruti1111"
    key            = "terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
  }
}