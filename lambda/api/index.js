const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
exports.handler = async (event) => {
  const headers = {"Access-Control-Allow-Origin":"*","Content-Type":"application/json"};
  try {
    const path = event.rawPath || "";
    if(path.includes("history")){
      const endpoint = event.queryStringParameters?.endpoint || "/api/auth";
      const hours = parseInt(event.queryStringParameters?.hours || "1");
      const since = new Date(Date.now()-hours*3600*1000).toISOString();
      const res = await client.send(new QueryCommand({
        TableName:"pulsegrid-telemetry",
        KeyConditionExpression:"#ep = :ep AND #ts > :since",
        ExpressionAttributeNames:{"#ep":"endpoint","#ts":"timestamp"},
        ExpressionAttributeValues:{":ep":endpoint,":since":since}
      }));
      return {statusCode:200, headers, body: JSON.stringify(res.Items||[])};
    }
    const res = await client.send(new ScanCommand({TableName:"pulsegrid-telemetry"}));
    const latest={};
    (res.Items||[]).forEach(i=>{ if(!latest[i.endpoint]||i.timestamp>latest[i.endpoint].timestamp) latest[i.endpoint]=i; });
    return {statusCode:200, headers, body: JSON.stringify(Object.values(latest))};
  }catch(e){return {statusCode:500, headers, body: JSON.stringify({error:e.message})}}
};
