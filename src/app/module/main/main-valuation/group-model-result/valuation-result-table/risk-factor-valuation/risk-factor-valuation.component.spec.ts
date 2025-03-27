import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskFactorValuationComponent } from './risk-factor-valuation.component';

describe('RiskFactorValuationComponent', () => {
  let component: RiskFactorValuationComponent;
  let fixture: ComponentFixture<RiskFactorValuationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskFactorValuationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiskFactorValuationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
