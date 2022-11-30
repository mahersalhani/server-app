const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// const confFile = path.join(__dirname, "..", "..", "..", "nginx", "conf", "sites-enabled");
const confFile = path.join("/", "etc", "nginx", 'sites-available');


exports.writeConfig = (shopName, template, port) => {
  const config = `
  server {
  listen       80;
  server_name  ${shopName}.${process.env.DOMAIN_NAME};


  location / {
    root   ${process.env.ROOT}/${template}/build/;

    index  index.html index.htm;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass  http://${process.env.IP_ADDRESS}:${port};
    proxy_http_version 1.1;
    # proxy_set_header x-subdomain $subdomain;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    }

  error_page   500 502 503 504  /50x.html;
  location = /50x.html {
    root   html;
  }
}`;

  fs.writeFileSync(path.join(confFile, `${shopName}.conf`), config);

  exec("nginx -s reload", (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
  });
};
