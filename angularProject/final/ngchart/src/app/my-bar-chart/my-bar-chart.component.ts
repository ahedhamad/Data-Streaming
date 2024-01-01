import { Component, OnInit, OnDestroy } from '@angular/core'; 

import { Chart, registerables } from 'chart.js';
import { TraindataService } from '../traindata.service'; 
import { Subscription, interval } from 'rxjs'; 
import { switchMap } from 'rxjs/operators'; 

@Component({
  selector: 'app-my-bar-chart', 
  templateUrl: './my-bar-chart.component.html', 
  styleUrls: ['./my-bar-chart.component.css'] 
})

export class MyBarChartComponent implements OnInit, OnDestroy { 
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

      this.chart = new Chart('canvas', { // Creating a new bar chart using Chart.js
        type: 'bar',
        data: {
          labels: this.userName, // Setting labels for the user name 
          datasets: [
            {
              data: this.tweetCount, // Setting data values for the tweet count
              borderColor: '#4DB380',
              label: 'Top 20 Users', 
              backgroundColor: 'rgba(93, 175, 89, 0.1)',
              borderWidth: 3,
            },
          ],
        },
      });
    });
  }

  
  // Method to update the chart with new data
  updateChart() { 
    if (this.chart && this.chart.data) { 
      this.chart.data.labels = this.userName; 
      this.chart.data.datasets[0].data = this.tweetCount; 
      this.chart.update();
      console.log(' Par chart updated with new data'); 
    }
  }
}
