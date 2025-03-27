import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRolloutComponent } from './product-rollout.component';

describe('ProductRolloutComponent', () => {
  let component: ProductRolloutComponent;
  let fixture: ComponentFixture<ProductRolloutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductRolloutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductRolloutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
