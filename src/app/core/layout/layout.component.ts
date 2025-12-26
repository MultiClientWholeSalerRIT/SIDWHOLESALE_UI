import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
declare var main: any;

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    standalone: false
})
export class LayoutComponent implements OnInit {
    constructor(private router: Router) { }

    ngOnInit(): void {
        // Initialize main after a small delay to ensure DOM is ready
        setTimeout(() => {
            new main();
        }, 0);

        // Subscribe to router events
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            // Check if we're on mobile (screen width < 1200px)
            if (window.innerWidth < 1200) {
                // Close sidebar on mobile
                document.body.classList.remove('toggle-sidebar');
            }
        });
    }
}
