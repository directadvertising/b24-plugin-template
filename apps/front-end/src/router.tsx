import { Route, Switch } from "wouter";
import { HomePage } from "@/features/home";
import { InstallPage } from "@/features/install";

export function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/install" component={InstallPage} />
    </Switch>
  );
}
