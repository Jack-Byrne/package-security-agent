# TICKET-012: AWS Lambda Deployment

## Context

Create AWS Lambda deployment configuration for running Security Agent as a serverless function with EventBridge scheduling and webhook support.

## Prerequisites

- TICKET-001 through TICKET-008 completed

## Objective

Create Lambda deployment that:

1. Runs as AWS Lambda function
2. Triggered by EventBridge (scheduled) or API Gateway (webhooks)
3. Clones repositories from GitHub
4. Runs security scans
5. Creates PRs via GitHub API
6. Logs to CloudWatch
7. Uses Secrets Manager for credentials

## Key Components

### `packages/deployments/aws-lambda/handler.ts`

- Lambda handler function
- Event parsing (EventBridge vs API Gateway)
- Repository cloning
- Orchestrator execution
- Error handling and logging

### `packages/deployments/aws-lambda/serverless.yml`

- Serverless Framework configuration
- Lambda function definition
- EventBridge schedule rules
- API Gateway endpoints
- IAM roles and permissions
- Environment variables

### `packages/deployments/aws-lambda/README.md`

- Deployment instructions
- Configuration guide
- Secrets setup

## Acceptance Criteria

### ✅ Validation Steps

1. Build succeeds: `npm run build`
2. Lambda package created
3. Can deploy with `serverless deploy`
4. Function runs successfully
5. EventBridge triggers work
6. API Gateway webhooks work
7. CloudWatch logs appear
8. Creates PRs successfully

### 📋 Checklist

- [ ] Lambda handler implementation
- [ ] Event parsing (EventBridge/API Gateway)
- [ ] Repository cloning logic
- [ ] Serverless Framework config
- [ ] IAM roles and permissions
- [ ] Environment variable setup
- [ ] Secrets Manager integration
- [ ] CloudWatch logging
- [ ] Deployment documentation
- [ ] Example event payloads

## Success Metrics

- ✅ Deploys successfully to AWS
- ✅ Runs within Lambda limits (15 min timeout)
- ✅ Handles cold starts efficiently
- ✅ Logs are clear and useful
- ✅ Webhooks respond quickly

## Reference

- `ARCHITECTURE.md` - Lambda deployment design
- AWS Lambda docs: https://docs.aws.amazon.com/lambda/
- Serverless Framework: https://www.serverless.com/
