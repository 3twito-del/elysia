export function subscribeToNoopStore() {
  return () => undefined;
}

export function getClientSnapshot() {
  return true;
}

export function getServerSnapshot() {
  return false;
}
