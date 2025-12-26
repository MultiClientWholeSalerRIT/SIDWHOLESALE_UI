import { Component, OnInit } from '@angular/core';
declare var main:any
@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    new main()
  }
  scrollToTop(){
    window.scroll(0,0);
  }

}
