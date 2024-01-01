import { Injectable } from '@angular/core'; 
import { HttpClient ,HttpHeaders} from '@angular/common/http'; 
import { io, Socket } from 'socket.io-client'; 
import { BehaviorSubject } from 'rxjs'; 

// Define HTTP headers
const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json', // Setting content type as JSON
    'Access-Control-Allow-Origin': '*', // CORS header for allowing all origins
  }),
};

@Injectable({
  providedIn: 'root' 
})
export class TraindataService {
   private socket: Socket; 

  // Create a BehaviorSubject to hold the top 20 users' data
  private topTwentyUsersSubject = new BehaviorSubject<any[]>([]); 
  public topTwentyUsers$ = this.topTwentyUsersSubject.asObservable(); // Exposing an observable for topTwentyUsers data

  // Create a BehaviorSubject to hold the tweets by day for users' data
  private tweetsByDayForUserSubject = new BehaviorSubject<any[]>([]);
  public tweetsByDayForUser$ = this.tweetsByDayForUserSubject.asObservable();

  constructor(private http: HttpClient) { 
    this.socket = io('http://localhost:3002', { transports: ['websocket', 'polling', 'flashsocket'] });
    
   
    this.socket.on('TopTwentyUsers', (data: any[]) => { // Listening for 'TopTwentyUsers' event
      this.topTwentyUsersSubject.next(data); // Pushing new data to the BehaviorSubject
    });
    
    this.socket.on('TweetsByDayForUser', (data: any[]) => { // Listening for 'TweetsByDayForUser' event
      this.tweetsByDayForUserSubject.next(data); // Pushing new data to the BehaviorSubject
    });
  }

  getTopTwentyUsersData() {
    const url = `http://localhost:3002/TopTwentyUsers`; 
    return this.http.get<any[]>(url); // Making an HTTP GET request to fetch data
  }

  getTweetsByDayForUser(username: string) {
    const url = `http://localhost:3002/getTweetsByDayForUser?username="${username}"`;
    return this.http.get<any[]>(url);
  }

  // Method to subscribe to socket events
  subscribeToSocketEvents(): Socket { 
    return this.socket; // Returning the socket instance
  }
}
