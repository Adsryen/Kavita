import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { finalize, take, takeWhile } from 'rxjs/operators';
import { UpdateNotificationModalComponent } from 'src/app/shared/update-notification/update-notification-modal.component';
import { DownloadService } from 'src/app/shared/_services/download.service';
import { ServerService } from 'src/app/_services/server.service';
import { SettingsService } from '../settings.service';
import { ServerInfo } from '../_models/server-info';
import { ServerSettings } from '../_models/server-settings';

@Component({
  selector: 'app-manage-system',
  templateUrl: './manage-system.component.html',
  styleUrls: ['./manage-system.component.scss']
})
export class ManageSystemComponent implements OnInit {

  settingsForm: FormGroup = new FormGroup({});
  serverSettings!: ServerSettings;
  serverInfo!: ServerInfo;

  clearCacheInProgress: boolean = false;
  backupDBInProgress: boolean = false;
  isCheckingForUpdate: boolean = false;
  downloadLogsInProgress: boolean = false;

  constructor(private settingsService: SettingsService, private toastr: ToastrService, 
    private serverService: ServerService, public downloadService: DownloadService, 
    private modalService: NgbModal) { }

  ngOnInit(): void {

    this.serverService.getServerInfo().pipe(take(1)).subscribe(info => {
      this.serverInfo = info;
    });

    this.settingsService.getServerSettings().pipe(take(1)).subscribe((settings: ServerSettings) => {
      this.serverSettings = settings;
      this.settingsForm.addControl('cacheDirectory', new FormControl(this.serverSettings.cacheDirectory, [Validators.required]));
      this.settingsForm.addControl('taskScan', new FormControl(this.serverSettings.taskScan, [Validators.required]));
      this.settingsForm.addControl('taskBackup', new FormControl(this.serverSettings.taskBackup, [Validators.required]));
      this.settingsForm.addControl('port', new FormControl(this.serverSettings.port, [Validators.required]));
      this.settingsForm.addControl('loggingLevel', new FormControl(this.serverSettings.loggingLevel, [Validators.required]));
      this.settingsForm.addControl('allowStatCollection', new FormControl(this.serverSettings.allowStatCollection, [Validators.required]));
    });
  }

  resetForm() {
    this.settingsForm.get('cacheDirectory')?.setValue(this.serverSettings.cacheDirectory);
    this.settingsForm.get('scanTask')?.setValue(this.serverSettings.taskScan);
    this.settingsForm.get('taskBackup')?.setValue(this.serverSettings.taskBackup);
    this.settingsForm.get('port')?.setValue(this.serverSettings.port);
    this.settingsForm.get('loggingLevel')?.setValue(this.serverSettings.loggingLevel);
    this.settingsForm.get('allowStatCollection')?.setValue(this.serverSettings.allowStatCollection);
  }

  saveSettings() {
    const modelSettings = this.settingsForm.value;

    this.settingsService.updateServerSettings(modelSettings).pipe(take(1)).subscribe((settings: ServerSettings) => {
      this.serverSettings = settings;
      this.resetForm();
      this.toastr.success('Server settings updated');
    }, (err: any) => {
      console.error('error: ', err);
    });
  }

  clearCache() {
    this.clearCacheInProgress = true;
    this.serverService.clearCache().subscribe(res => {
      this.clearCacheInProgress = false;
      this.toastr.success('Cache has been cleared');
    });
  }

  backupDB() {
    this.backupDBInProgress = true;
    this.serverService.backupDatabase().subscribe(res => {
      this.backupDBInProgress = false;
      this.toastr.success('Database has been backed up');
    });
  }

  checkForUpdates() {
    this.isCheckingForUpdate = true;
    this.serverService.checkForUpdate().subscribe((update) => { 
      this.isCheckingForUpdate = false;
      if (update === null) {
        this.toastr.info('No updates available');
        return;
      }
      const modalRef = this.modalService.open(UpdateNotificationModalComponent, { scrollable: true, size: 'lg' });
      modalRef.componentInstance.updateData = update;
    });
  }

  downloadLogs() {
    this.downloadLogsInProgress = true;
    this.downloadService.downloadLogs().pipe(
      takeWhile(val => {
        return val.state != 'DONE';
      }),
      finalize(() => {
        this.downloadLogsInProgress = false;
      })).subscribe(() => {/* No Operation */});
  }

}
