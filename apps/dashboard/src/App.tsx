import { Route, Switch } from "wouter";
import { Sidebar } from "./components/layout/Sidebar.js";
import { Header } from "./components/layout/Header.js";
import { DateRangeProvider } from "./hooks/use-date-range.js";
import { Overview } from "./pages/Overview.js";
import { Costs } from "./pages/Costs.js";
import { Quality } from "./pages/Quality.js";
import { Feed } from "./pages/Feed.js";
import { Settings } from "./pages/Settings.js";
import { Features } from "./pages/Features.js";
import { Users } from "./pages/Users.js";
import { Workspaces } from "./pages/Workspaces.js";
import { Personas } from "./pages/Personas.js";
import { Trends } from "./pages/Trends.js";

export function App() {
  return (
    <DateRangeProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 pb-12">
            <Switch>
              <Route path="/" component={Overview} />
              <Route path="/costs" component={Costs} />
              <Route path="/users" component={Users} />
              <Route path="/workspaces" component={Workspaces} />
              <Route path="/personas" component={Personas} />
              <Route path="/features" component={Features} />
              <Route path="/trends" component={Trends} />
              <Route path="/quality" component={Quality} />
              <Route path="/live" component={Feed} />
              <Route path="/settings" component={Settings} />
            </Switch>
          </main>
        </div>
      </div>
    </DateRangeProvider>
  );
}
