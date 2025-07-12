function fetchIPs(project, token) {
  const response = UrlFetchApp.fetch(
    `https://compute.googleapis.com/compute/v1/projects/${project}/aggregated/instances`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = JSON.parse(response.getContentText());
  let ips = [];
  for (let zone in data.items) {
    const instances = data.items[zone].instances;
    if (!instances) continue;
    for (let i = 0; i < instances.length; i++) {
      const interfaces = instances[i].networkInterfaces;
      if (!interfaces) continue;
      for (let j = 0; j < interfaces.length; j++) {
        const configs = interfaces[j].accessConfigs;
        if (!configs) continue;
        for (let k = 0; k < configs.length; k++) {
          const ip = configs[k].natIP;
          if (ip) ips.push(ip);
        }
      }
    }
  }
  return ips;
}

function run() {
  const properties = PropertiesService.getScriptProperties();
  const bucket = properties.getProperty('BUCKET_NAME');
  const token = ScriptApp.getOAuthToken();
  UrlFetchApp.fetch(
    `https://${bucket}.storage.googleapis.com/ips`,
    {
      method: 'put',
      payload: JSON.stringify({
        'Testnet': fetchIPs(properties.getProperty('TESTNET_PROJECT_NAME'), token),
        'Mainnet': fetchIPs(properties.getProperty('MAINNET_PROJECT_NAME'), token)
      }),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/json',
        
      },
    }
  );
}
