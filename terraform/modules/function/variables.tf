variable "basic_config" {
  description = "Basic Configuration"
  type = object({
    environment    = string
    gcp_project_id = string
    gcp_region     = string
  })
}

variable "function_config" {
  description = "Cloud Function configuration"
  type = object({
    name                             = string
    description                      = string
    runtime                          = string
    entry_point                      = string
    available_memory_mb              = number
    timeout_seconds                  = number
    environment_variables            = map(string)
    pubsub_topic                     = string
    source_bucket                    = string
    build_time_service_account_email = string
    run_time_service_account_email   = string
  })
}
