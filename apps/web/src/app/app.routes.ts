import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { guestGuard } from "./core/guards/guest.guard";
import { ShellComponent } from "./layout/shell/shell.component";
import { LoginComponent } from "./features/login/login.component";
import { DashboardComponent } from "./features/dashboard/dashboard.component";
import { ClientsComponent } from "./features/clients/clients.component";
import { ProductsComponent } from "./features/products/products.component";
import { EmployeesComponent } from "./features/employees/employees.component";
import { SaleComponent } from "./features/sale/sale.component";
import { HistoryComponent } from "./features/history/history.component";
import { DebtsComponent } from "./features/debts/debts.component";
import { ReportsComponent } from "./features/reports/reports.component";
import { CamerasComponent } from "./features/cameras/cameras.component";
import { ChatbotComponent } from "./features/chatbot/chatbot.component";
import { SettingsComponent } from "./features/settings/settings.component";

export const routes: Routes = [
  {
    path: "login",
    canActivate: [guestGuard],
    component: LoginComponent
  },
  {
    path: "",
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
      { path: "dashboard", component: DashboardComponent, data: { pageId: "dashboard" } },
      { path: "clientes", component: ClientsComponent, data: { pageId: "clientes" } },
      { path: "produtos", component: ProductsComponent, data: { pageId: "produtos" } },
      { path: "funcionarios", component: EmployeesComponent, data: { pageId: "funcionarios" } },
      { path: "vendas/nova", component: SaleComponent, data: { pageId: "nova-venda" } },
      { path: "historico", component: HistoryComponent, data: { pageId: "historico" } },
      { path: "fiado", component: DebtsComponent, data: { pageId: "fiado" } },
      { path: "relatorios", component: ReportsComponent, data: { pageId: "relatorios" } },
      { path: "cameras", component: CamerasComponent, data: { pageId: "cameras" } },
      { path: "chatbot", component: ChatbotComponent, data: { pageId: "chatbot" } },
      { path: "configuracoes", component: SettingsComponent, data: { pageId: "configuracoes" } }
    ]
  },
  { path: "**", redirectTo: "" }
];
