#!/bin/bash
get_environment_config() {
    if [ "$#" -ne 3 ]; then
        echo "Usage: get_environment_config <repository-name> <branch-name> <developer-name>" >&2
        return 1
    fi

    local REPOSITORY_NAME=$1
    local BRANCH_NAME=$2
    local DEVELOPER_NAME=$3

    case $BRANCH_NAME in
    refs/tags/*)
        echo "environment_name=prod"
        echo "state_prefix=prod/${REPOSITORY_NAME}"
        echo "skip=false"
        echo "branch_name=tag"
        ;;
    refs/heads/main)
        echo "environment_name=preprod"
        echo "state_prefix=preprod/${REPOSITORY_NAME}"
        echo "skip=false"
        echo "branch_name=main"
        ;;
    refs/heads/feature/*)
        local FEATURE_NAME=$(echo $BRANCH_NAME | sed 's/refs\/heads\/feature\///' | tr '/' '-')
        echo "environment_name=${DEVELOPER_NAME}-${FEATURE_NAME}"
        # echo "environment_name=dev"
        echo "state_prefix=features/${REPOSITORY_NAME}/${DEVELOPER_NAME}/${FEATURE_NAME}"
        echo "skip=false"
        echo "branch_name=feature"
        ;;
    refs/heads/release/*)
        echo "environment_name=uat"
        echo "state_prefix=uat/${REPOSITORY_NAME}"
        echo "skip=false"
        echo "branch_name=release"
        ;;
    refs/heads/hotfix/*)
        echo "environment_name=uat"
        echo "state_prefix=uat/${REPOSITORY_NAME}"
        echo "skip=false"
        echo "branch_name=hotfix"
        ;;
    refs/heads/develop | refs/heads/dev)
        echo "environment_name=dev"
        echo "state_prefix=dev/${REPOSITORY_NAME}"
        echo "skip=false"
        echo "branch_name=dev"
        ;;
    esac
}
