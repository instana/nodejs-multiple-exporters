# OpenTelemetry Multiple Exporter Demo

This is a proof of concept on how to send OpenTelemetry spans from a Node.js application to two different observability backends. In this example application, two different Instana backends are used. This can easily modified to send to one Instana backend and another backend that can process OpenTelemetry data, for example Grafana Tempo.

Note that there is at least one other approach for achieving the same goal: Deploy an [OpenTelemetry collector](https://opentelemetry.io/docs/collector/) as a standalone service for multiplexing.

The OpenTelemetry collector can then be configured with multiple exporters as well: <https://opentelemetry.io/docs/collector/configuration/#exporters>.

One exporter would export to Instana; either to the Instana agent (which can act as an OTel endpoint as well) or directly to the Instana backend via this [Instana exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/instanaexporter). See https://www.ibm.com/docs/en/instana-observability/current?topic=apis-opentelemetry#configuring-opentelemetry-data-ingestion for more details.

Also note that the term "exporter" is overloaded with regard to OpenTelemetry. It can either refer to an in-process exporter (like the `@opentelemetry/exporter-trace-otlp-grpc` or the `@instana/opentelemetry-exporter` packages used in this example application), or it can refer to the [exporter plug-ins](https://opentelemetry.io/docs/collector/configuration/#exporters) for the OpenTelemetry collector.

## Setup

```
cp env.template .env

# Edit .env to provide the Instana agent key(s) and endpoint URLs.
vim .env
```

## Start the Example

### Docker Compose

The `docker-compose.yaml` file will start an Instana host agent and the example Node.js application.

```
docker-compose --env-file .env build && docker-compose --env-file .env up
```

### Without Containers

You can also start the example application direcly via Node.js/npm.

First, start an Instana agent (see https://www.ibm.com/docs/en/instana-observability/current?topic=agents-installing-host-agent-linux or https://www.ibm.com/docs/en/instana-observability/current?topic=agents-installing-host-agent-mac-os).

Then start the application as follows:

```
# Install dependencies:
npm install

# Start the application:
INSTANA_ENDPOINT_URL=https://serverless-red-saas.instana.io INSTANA_AGENT_KEY=... npm start
```

Note: On **MacOS**, processes running directly on the MacOS host can only be monitored by an Instana host agent running directly on the MacOS host as well, not by an Instana host agent running in a container. Correspondingly, the Instana agent can only monitor processes running in containers if the agent itself is also started in a container. See https://www.ibm.com/docs/en/instana-observability/current?topic=agents-installing-host-agent-mac-os#limitations.

## Create Traffic

To create traffic, you could start this in a separate shell:

```
watch curl http://localhost:8080/
```
