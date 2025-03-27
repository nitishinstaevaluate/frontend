import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreCardValuationComponent } from './score-card-valuation.component';

describe('ScoreCardValuationComponent', () => {
  let component: ScoreCardValuationComponent;
  let fixture: ComponentFixture<ScoreCardValuationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoreCardValuationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScoreCardValuationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
