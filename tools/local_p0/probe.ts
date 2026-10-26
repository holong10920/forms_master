import { connect } from "node:net";
const denied = await new Promise<boolean>((resolve, reject) => {
  const socket = connect({ host: "198.51.100.1", port: 80 });
  socket.setTimeout(1500, () => {
    socket.destroy();
    reject(Error("E-EGRESS-NOT-DENIED"));
  });
  socket.on("connect", () => {
    socket.destroy();
    reject(Error("E-EGRESS-OPEN"));
  });
  socket.on("error", (e: NodeJS.ErrnoException) => {
    if (e.code === "EPERM") resolve(true);
    else reject(e);
  });
});
const local = await fetch("http://127.0.0.1:4175/");
if (!local.ok) throw Error("E-LOCAL-DENIED");
console.log(
  JSON.stringify({
    roles: ["Admin API", "Form API", "Preview API", "build worker"],
    externalDeniedByKernel: denied,
    localAllowed: true,
  }),
);
