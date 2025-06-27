variable "basic_config" {
  description = "Basic Configuration"
  type = object({
    environment                                  = string
    gcp_project_id                               = string
    gcp_region                                   = string
    tf_state_bucket                              = string
    tf_encryption_key                            = string
    tf_state_prefix_for_shared_resources         = string
    tf_state_prefix_for_github_actions_resources = string
  })
}

# Storage configuration variables
variable "storages" {
  description = "Map of storage configurations including bucket names, force destroy settings, and IAM roles"
  type = map(object({
    name          = string
    force_destroy = bool
  }))
}

# Function configuration variables
variable "functions" {
  description = "Map of Cloud Functions configurations"
  type = map(object({
    name                  = string
    description           = string
    runtime               = string
    entry_point           = string
    available_memory_mb   = number
    timeout_seconds       = number
    environment_variables = map(string)
    pubsub_topic          = string
  }))
}
