export function GET({view}) {
  return view("sudo/dashboard", {
    title: "Dashboard",
  });
}
