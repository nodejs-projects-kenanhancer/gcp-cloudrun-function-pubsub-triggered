locals {
  # function_archive_name = "${var.function_config.name}-${data.archive_file.function_source.output_md5}.zip"
  project_root = "${path.root}/.."
  source_dir   = local.project_root

  # Create a hash of all source files and dependencies
  source_hash = sha1(join("", [
    # Hash package.json
    filemd5("${local.source_dir}/package.json"),
    # Hash yarn.lock
    filemd5("${local.source_dir}/yarn.lock"),
    # Hash all TypeScript files in src
    sha1(join("", [for f in fileset("${local.source_dir}/src", "**/*.ts") : filemd5("${local.source_dir}/src/${f}")])),
    # Hash any environment variables or other config that should trigger a rebuild
    jsonencode(var.function_config.environment_variables)
  ]))

  # Use source_hash directly in the archive name instead of the zip's md5
  function_archive_name = "${var.function_config.name}-${local.source_hash}.zip"
}

# Create the function archive
data "archive_file" "function_source" {
  type       = "zip"
  source_dir = "${local.source_dir}/dist"
  # Use source_hash in the output path to maintain consistency
  output_path = "${local.project_root}/dist/${var.function_config.name}-${local.source_hash}.zip"
  excludes = [
    "*.d.ts",
    "*.js.map",
    "tsconfig.build.tsbuildinfo",
    "*.zip" # Exclude all zip files instead of specific one
  ]
}

resource "google_storage_bucket_object" "function_archive" {
  depends_on = [data.archive_file.function_source]

  name   = local.function_archive_name
  bucket = var.function_config.source_bucket
  source = data.archive_file.function_source.output_path
}

resource "google_cloudfunctions2_function" "function" {
  depends_on = [google_storage_bucket_object.function_archive]

  name        = "${var.function_config.name}-${var.basic_config.environment}"
  location    = var.basic_config.gcp_region
  description = "Cloud function for ${var.basic_config.environment}"

  build_config {
    runtime         = var.function_config.runtime
    entry_point     = var.function_config.entry_point
    service_account = var.function_config.build_time_service_account_email
    source {
      storage_source {
        bucket = var.function_config.source_bucket
        object = google_storage_bucket_object.function_archive.name
      }
    }
  }

  service_config {
    available_memory      = "${var.function_config.available_memory_mb}M"
    timeout_seconds       = var.function_config.timeout_seconds
    environment_variables = var.function_config.environment_variables
    service_account_email = var.function_config.run_time_service_account_email
  }

  event_trigger {
    trigger_region        = var.basic_config.gcp_region
    event_type            = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic          = "projects/${var.basic_config.gcp_project_id}/topics/${var.function_config.pubsub_topic}"
    retry_policy          = "RETRY_POLICY_RETRY"
    service_account_email = var.function_config.run_time_service_account_email
  }
}
