import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentureCapitalValuationComponent } from './venture-capital-valuation.component';

describe('VentureCapitalValuationComponent', () => {
  let component: VentureCapitalValuationComponent;
  let fixture: ComponentFixture<VentureCapitalValuationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VentureCapitalValuationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentureCapitalValuationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});