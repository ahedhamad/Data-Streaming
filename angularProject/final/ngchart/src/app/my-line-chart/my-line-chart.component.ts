import { Component, OnInit, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { TraindataService } from '../traindata.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-my-line-chart',
  templateUrl: './my-line-chart.component.html',
  styleUrls: ['./my-line-chart.component.css']
})
export class MyLineChartComponent implements OnInit, OnDestroy {
  result: any[] = [];
  userName: string = "";
  date: string[] = [];
  tweetCount: number[] = [];
  chart: Chart | null = null;
  subscription: Subscription | undefined;
  timerSubscription: Subscription | undefined;

  constructor(private service: TraindataService) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.updateChart(); // Initial chart rendering based on default username

    // Start a timer to update the chart data every 2 seconds
    this.timerSubscription = interval(2000)
      .pipe(
        switchMap(() => this.service.getTweetsByDayForUser(this.userName))
      )
      .subscribe((data: any[]) => {
        this.result = data;
        this.updateChartData();
      });
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy(); // Destroy chart when component is destroyed to prevent memory leaks
    }
    
    // Unsubscribe from the observables to prevent memory leaks
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  async updateChart() {
    try {
      if (this.userName.trim() !== "") {
        // Fetch data for the given username
        this.subscription = this.service.getTweetsByDayForUser(this.userName)
          .subscribe((data: any[]) => {
            this.result = data;
            this.updateChartData();
          });
      } else {
        console.log("Username is empty. Please enter a username.");
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  updateChartData() {
    if (!Array.isArray(this.result)) {
      console.error('Invalid data format:', this.result);
      return;
    }

    this.date = this.result.map((dayWise: any) => {
      const { year, month, day } = dayWise._id;
      return `${year}-${month}-${day}`;
    });
    this.tweetCount = this.result.map(item => item.count); // Assuming the result has 'count' property for tweet count

    // If chart exists, destroy it to refresh with new data
    if (this.chart) {
      this.chart.destroy();
    }

    // Create a new Chart instance
    this.chart = new Chart('canvas', {
      type: 'line',
      data: {
        labels: this.date,
        datasets: [
          {
            data: this.tweetCount,
            borderColor: '#f37107',
            label: 'Day wise',
            borderWidth: 2,
          },
        ],
      },
    });
  }
}
