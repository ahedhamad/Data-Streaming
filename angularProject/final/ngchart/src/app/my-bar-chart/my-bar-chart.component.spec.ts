import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyBarChartComponent } from './my-bar-chart.component';

describe('MyBarChartComponent', () => {
  let component: MyBarChartComponent;
  let fixture: ComponentFixture<MyBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyBarChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MyBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
