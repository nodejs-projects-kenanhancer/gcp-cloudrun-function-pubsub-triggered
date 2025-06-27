variable "basic_config" {
  description = "Basic Configuration"
  type = object({
    environment    = string
    gcp_project_id = string
    gcp_region     = string
  })
}

variable "bucket_config" {
  description = "Cloud Storage configuration"
  type = object({
    name          = string
    force_destroy = bool
  })
}
