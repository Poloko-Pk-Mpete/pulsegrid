const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = "pulsegrid-telemetry";

const sanitize = (item) => ({
  endpoint: item.endpoint,
  status: item.status,
  latencyMs: item.latencyMs,
  statusCode: item.statusCode,
  timestamp: item.timestamp
});

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const path = event.rawPath || event.path || "";

    if (path.includes("history")) {
      const endpoint = event.queryStringParameters?.endpoint || "/api/auth";
      const hours = Math.min(parseInt(event.queryStringParameters?.hours || "1"), 24);
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();

      const res = await client.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#ep = :ep AND #ts > :since",
        ExpressionAttributeNames: { "#ep": "endpoint", "#ts": "timestamp" },
        ExpressionAttributeValues: { ":ep": endpoint, ":since": since },
        ScanIndexForward: false,
        Limit: 100
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify((res.Items || []).map(sanitize))
      };
    }

    const res = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
    const latest = {};

    (res.Items || []).forEach(item => {
      if (!latest[item.endpoint] || item.timestamp > latest[item.endpoint].timestamp) {
        latest[item.endpoint] = sanitize(item);
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(Object.values(latest))
    };

  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal error" })
    };
  }
};
