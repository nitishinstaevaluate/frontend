import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentureCapitalComponent } from './venture-capital.component';

describe('VentureCapitalComponent', () => {
  let component: VentureCapitalComponent;
  let fixture: ComponentFixture<VentureCapitalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VentureCapitalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentureCapitalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
