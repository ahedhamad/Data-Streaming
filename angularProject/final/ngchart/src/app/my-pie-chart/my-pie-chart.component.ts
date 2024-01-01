import { Component, OnInit, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { TraindataService } from '../traindata.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
@Component({
  selector: 'app-my-pie-chart',
  templateUrl: './my-pie-chart.component.html',
  styleUrl: './my-pie-chart.component.css'
})
export class MyPieChartComponent implements OnInit {
  userName: string[] = [];
  tweetCount: number[] = [];
  chart: any;
  socketSubscription: any;

  constructor(private service: TraindataService) {
    Chart.register(...registerables); // Registering Chart.js functionalities
  }


  ngOnInit() {
    this.initChart();

    // Subscribing to an interval observable (every 2 seconds)
    this.socketSubscription = interval(2000)
      .pipe(
        switchMap(() => this.service.getTopTwentyUsersData()) // Switching to the service observable to get top 20 user data
      )

      // Subscribing to the data emitted by the observable
      .subscribe((result: any[]) => {
        this.userName = result.map((users: any) => users._id);
        this.tweetCount = result.map((counts: any) => counts.tweetCount);

        this.updateChart(); // Updating the chart with new data
      });

    // Subscribing to 'TopTwentyUsers' event for real-time updates
    this.service.subscribeToSocketEvents().on('TopTwentyUsers', (topUsers: any[]) => {
      this.userName = topUsers.map(user => user._id);
      this.tweetCount = topUsers.map(user => user.tweetCount);

      this.updateChart(); // Updating the chart with real-time data

      console.log('TopTwentyUsers event received:', topUsers);
    });
  }

  ngOnDestroy() {
    if (this.socketSubscription) { // Unsubscribing from socketSubscription to prevent memory leaks
      this.socketSubscription.unsubscribe();
    }
  }

  // Method to destroy the existing chart
  private destroyChart() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  initChart() {
    // Fetching initial data from the service
    this.service.getTopTwentyUsersData().subscribe((res) => {
      const result = res;

      this.userName = result.map((users: any) => users._id);
      this.tweetCount = result.map((counts: any) => counts.tweetCount);

      // Destroying any existing chart
      this.destroyChart();

      // Define colors for the pie chart
      const colors = [
        '#3e95cd', '#8e5ea2', '#e8c3b9', '#c45850', '#FF6633',
        '#FFB399', '#FFFF99', '#00B3E6', '#E6B333', '#CCFF1A',
        '#FF1A66', '#E6331A', '#33FFCC', '#B33300', '#4D80CC',
        '#9900B3', '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6'
      ];

      // Generate colors for each user based on their index
      const userColors = this.userName.map((user: any, index: number) => {
        return colors[index % colors.length];
      });

      // Create a pie chart using Chart.js
      this.chart = new Chart('canvas', {
        type: 'pie',
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

  // Method to update the chart with new data
  updateChart() {
    // Check if chart and its data are defined before updating
    if (this.chart && this.chart.data) {
      this.chart.data.labels = this.userName;
      this.chart.data.datasets[0].data = this.tweetCount;
      this.chart.update();
      console.log('Pie chart updated with new data');
    }
  }
}
  
  
  
