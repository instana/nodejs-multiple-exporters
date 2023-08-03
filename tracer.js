'use strict';

const { BatchSpanProcessor, ConsoleSpanExporter, NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

// Optional, just for demo purposes (see below).
const { InstanaExporter } = require('@instana/opentelemetry-exporter');

// register Node.js auto instrumentations (http etc.)
registerInstrumentations({
  instrumentations: [
    getNodeAutoInstrumentations({
      // The instrumentation for fs creates a lot of noise, lets disable it.
      '@opentelemetry/instrumentation-fs': {
        enabled: false
      }
    })
  ]
});

let exporter1;
let exporter2;
let otelExporterOtlpEndpoint1 = 'http://localhost:4317';
if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT_1) {
  otelExporterOtlpEndpoint1 = process.env.OTEL_EXPORTER_OTLP_ENDPOINT_1;
} else {
  console.log(
    `The environment variable OTEL_EXPORTER_OTLP_ENDPOINT_1 is not set. Falling back to default value: ${otelExporterOtlpEndpoint1}.`
  );
}
console.log(`Using OTLP endpoint 1: ${otelExporterOtlpEndpoint1}`);

// Exporter 1 will send spans to the Instana host agent. We assume the host agent is running on the same machine. This
// will enable correlating spans with infrastructre information. This is the recommended way to send the OTel spans to
// Instana. A couple of other options are available as well:
// * Send spans directly to Instana's backend in the OTel format via OTLP:
//     * see https://www.ibm.com/docs/en/instana-observability/current?topic=apis-opentelemetry#sending-otlp-data-to-instana-backend
//     * This feature (otlp-acceptor) is currently in open beta, so it might need to be activated for your tenant.
// * Send spans directly to Instana's backend in the proprietary Instana span format via the package `@instana/opentelemetry-exporter`
//     * see https://www.ibm.com/docs/en/instana-observability/current?topic=apis-opentelemetry#sending-native-data-to-instana-backend-by-using-instana-exporter
//     * (or see the setup of exporter2 which uses this approach)
//
// See https://www.ibm.com/docs/en/instana-observability/current?topic=apis-opentelemetry#configuring-opentelemetry-data-ingestion
// for more details on the different approaches that are available options.

exporter1 = new OTLPTraceExporter({
  url: otelExporterOtlpEndpoint1
});

// Exporter 2: Instantiate the Instana Exporter, we will use this as our _second_ exporter. For McAfee's scenario, this
// could easily be replaced by an exporter that sends to Grafana Tempo directly.
//
// However, if the InstanaExporter is used, you need to make sure that the Instana agent key and the serverless
// endpoint URL have been set via the environment variables INSTANA_AGENT_KEY and INSTANA_ENDPOINT_URL respectively. See
// the files env.template/.env for more information.
//
// Of course, with this setup, the spans will end up in the same Instana backend if the
// INSTANA_AGENT_KEY/INSTANA_ENDPOINT_URL combination used for exporter2 and the ingress URL/agent key configured in the
// Instana host agent that exporter1 is sending to are the same. Use to different Instana tenant units to showcase
// sending to two different backends.

if (!process.env.INSTANA_AGENT_KEY) {
  throw new Error(`The mandatory environment variable INSTANA_AGENT_KEY is not set.`);
}
if (!process.env.INSTANA_ENDPOINT_URL) {
  throw new Error(`The mandatory environment variable INSTANA_AGENT_KEY is not set.`);
}
console.log(`Using ${process.env.INSTANA_ENDPOINT_URL} as the second backend via @instana/opentelemetry-exporter.`);
exporter2 = new InstanaExporter();

// Alternatively, you can could also use a simple console exporter for exporter 2 for demo purposes.
// exporter2 = new ConsoleSpanExporter();

// Create a tracer provider.
const tracerProvider = new NodeTracerProvider();

// Register **two** span processors (which in turn are connected to **two different exporters**). This will effectively
// multiplex all spans to two different backends.
tracerProvider.addSpanProcessor(new BatchSpanProcessor(exporter1));
tracerProvider.addSpanProcessor(new BatchSpanProcessor(exporter2));
tracerProvider.register();
