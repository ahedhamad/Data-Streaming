import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyBarChartComponent } from './my-bar-chart/my-bar-chart.component';
import { MyDoughnutChartComponent } from './my-doughnut-chart/my-doughnut-chart.component';
import { MyPieChartComponent } from './my-pie-chart/my-pie-chart.component';
import { MyLineChartComponent } from './my-line-chart/my-line-chart.component';

const routes: Routes = [
  {path: 'bar-chart', component:MyBarChartComponent},
  {path: 'doughnut-chart', component:MyDoughnutChartComponent},
  {path: 'pie-chart', component:MyPieChartComponent},
  {path : 'line-chart', component: MyLineChartComponent},
  {path :'**', component: MyBarChartComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
