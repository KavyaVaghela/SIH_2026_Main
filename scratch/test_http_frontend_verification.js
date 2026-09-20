const http = require('http');

function checkLocalhostApi() {
  console.log("=== CHECKING LOCALHOST API RESPONSE FOR FRONTEND VERIFICATION ===");
  http.get('http://localhost:3000/api/projects', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log("HTTP GET http://localhost:3000/api/projects Status Code:", res.statusCode);
        const kushalProj = (json.projects || []).find(p => p.id === "d9b50ece-908a-4dd5-9b62-7b46ecf83350");
        console.log("Kushal Villa Wiring Project Server Response:", {
          id: kushalProj?.id,
          project_name: kushalProj?.project_name,
          required_workers_count: kushalProj?.required_workers_count,
          fulfilled_workers_count: kushalProj?.fulfilled_workers_count,
          remaining_workers_count: kushalProj?.remaining_workers_count,
          is_full: kushalProj?.is_full,
          requirement_status_text: kushalProj?.requirement_status_text,
        });
      } catch (e) {
        console.error("Error parsing JSON:", e.message, data.slice(0, 200));
      }
    });
  }).on('error', (err) => {
    console.error("Server connection error:", err.message);
  });
}

checkLocalhostApi();
