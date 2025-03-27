import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BerkusValuationComponent } from './berkus-valuation.component';

describe('BerkusValuationComponent', () => {
  let component: BerkusValuationComponent;
  let fixture: ComponentFixture<BerkusValuationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BerkusValuationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BerkusValuationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
