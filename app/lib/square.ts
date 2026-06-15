import { SquareClient, SquareEnvironment } from "square";
export function getSquareClient() {
  return new SquareClient({
    token: "EAAAl9mD3IZ-pH5NuPlF25oVMPpSHAfU8kmPsAn9mR575eCgRKSFlFAoPODypMQ2",
    environment: "https://connect.squareup.com",
  });
}

const _locationId = "L7SQKXWTFD1YV";
if (!_locationId) throw new Error("NEXT_PUBLIC_SQUARE_LOCATION_ID is not set");
export const LOCATION_ID = _locationId;
