const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const kubernetesFile = path.join(__dirname, "..", "..", "kubernetes");

exports.createContainer = async (port, shopName) => {
  fs.writeFileSync(
    path.join(kubernetesFile, `${shopName}-deployment.yaml`),
    `
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${shopName}-deployment
  labels:
    app: ${shopName}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${shopName}
  template:
    metadata:
      labels:
        app: ${shopName}
    spec:
      containers:
      - name: ${shopName}
        image: mahersalhany/server:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_URL
          # value: mongodb://mongodb-service:27017/posts
          value: mongodb+srv://test-username:HQQiVcKwBC1fo2YL@cluster0.15ca42m.mongodb.net
        - name: SHOP_NAME
          value: ${shopName}
---
apiVersion: v1
kind: Service
metadata:
  name: ${shopName}-service
spec:
  selector:
    app: ${shopName}
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 8080
    nodePort: ${port}
  type: NodePort
`
  );

  exec(`cd ${kubernetesFile} && kubectl apply -f ${shopName}-deployment.yaml`, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
  });
};
