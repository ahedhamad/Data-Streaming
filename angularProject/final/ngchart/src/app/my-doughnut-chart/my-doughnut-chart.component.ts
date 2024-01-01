import { Component, OnInit, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { TraindataService } from '../traindata.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-my-doughnut-chart',
  templateUrl: './my-doughnut-chart.component.html',
  styleUrl: './my-doughnut-chart.component.css'
})
export class MyDoughnutChartComponent implements OnInit {
  userName: string[] = [];
  tweetCount: number[] = [];
  chart: any;
  socketSubscription: any;

  constructor(private service: TraindataService) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.initChart();
    // Refresh the data and chart every 2 seconds
    this.socketSubscription = interval(2000)
      .pipe(
        switchMap(() => this.service.getTopTwentyUsersData())
      )
      .subscribe((result: any[]) => {
        this.userName = result.map((users: any) => users._id); // Extract user names
        this.tweetCount = result.map((counts: any) => counts.tweetCount); // Extract tweet counts
        this.updateChart();
      });
    // Subscribe to TopTwentyUsers event for real-time updates
    this.service.subscribeToSocketEvents().on('TopTwentyUsers', (topUsers: any[]) => {
      this.userName = topUsers.map(user => user._id);
      this.tweetCount = topUsers.map(user => user.tweetCount);
      this.updateChart();
      console.log('TopTwentyUsers event received:', topUsers);
    });
  }

  ngOnDestroy() {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }

  private destroyChart() {
    // Check if chart exists and destroy it
    if (this.chart) {
      this.chart.destroy();
    }
  }

  initChart() {
    // Fetch initial data from service
    this.service.getTopTwentyUsersData().subscribe((res) => {
      const result = res;
      this.userName = result.map((users: any) => users._id); // Extract user names
      this.tweetCount = result.map((counts: any) => counts.tweetCount); // Extract tweet counts

      this.destroyChart();
      // Define colors for the doughnut chart
      const colors = [
        '#3e95cd', '#8e5ea2', '#e8c3b9', '#c45850', '#FF6633',
      ];

      // Generate colors for each user based on their index
      const userColors = this.userName.map((user: any, index: number) => {
        return colors[index % colors.length];
      });

      // Create a doughnut chart using Chart.js
      this.chart = new Chart('canvas', {
        type: 'doughnut',
        data: {
          labels: this.userName,
          datasets: [
            {
              data: this.tweetCount,
              borderColor: '#fff',
              label: 'Top 20 Users',
              backgroundColor: userColors,
              borderWidth: 3,
            },
          ],
        },
      });
    });
  }

  updateChart() {
    // Check if chart and its data are defined before updating
    if (this.chart && this.chart.data) {
      this.chart.data.labels = this.userName;
      this.chart.data.datasets[0].data = this.tweetCount;
      this.chart.update();
      console.log(' Doughnut chart updated with new data');
    }
  }
}


