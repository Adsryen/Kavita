import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { ConfirmService } from 'src/app/shared/confirm.service';
import { SettingsService } from '../settings.service';
import { DirectoryPickerComponent, DirectoryPickerResult } from '../_modals/directory-picker/directory-picker.component';
import { ServerSettings } from '../_models/server-settings';

@Component({
  selector: 'app-manage-settings',
  templateUrl: './manage-settings.component.html',
  styleUrls: ['./manage-settings.component.scss']
})
export class ManageSettingsComponent implements OnInit {

  serverSettings!: ServerSettings;
  settingsForm: FormGroup = new FormGroup({});
  taskFrequencies: Array<string> = [];
  logLevels: Array<string> = [];

  constructor(private settingsService: SettingsService, private toastr: ToastrService, private confirmService: ConfirmService,
    private modalService: NgbModal) { }

  ngOnInit(): void {
    this.settingsService.getTaskFrequencies().pipe(take(1)).subscribe(frequencies => {
      this.taskFrequencies = frequencies;
    });
    this.settingsService.getLoggingLevels().pipe(take(1)).subscribe(levels => {
      this.logLevels = levels;
    });
    this.settingsService.getServerSettings().pipe(take(1)).subscribe((settings: ServerSettings) => {
      this.serverSettings = settings;
      this.settingsForm.addControl('cacheDirectory', new FormControl(this.serverSettings.cacheDirectory, [Validators.required]));
      this.settingsForm.addControl('bookmarksDirectory', new FormControl(this.serverSettings.bookmarksDirectory, [Validators.required]));
      this.settingsForm.addControl('taskScan', new FormControl(this.serverSettings.taskScan, [Validators.required]));
      this.settingsForm.addControl('taskBackup', new FormControl(this.serverSettings.taskBackup, [Validators.required]));
      this.settingsForm.addControl('port', new FormControl(this.serverSettings.port, [Validators.required]));
      this.settingsForm.addControl('loggingLevel', new FormControl(this.serverSettings.loggingLevel, [Validators.required]));
      this.settingsForm.addControl('allowStatCollection', new FormControl(this.serverSettings.allowStatCollection, [Validators.required]));
      this.settingsForm.addControl('enableOpds', new FormControl(this.serverSettings.enableOpds, [Validators.required]));
      this.settingsForm.addControl('enableAuthentication', new FormControl(this.serverSettings.enableAuthentication, [Validators.required]));
      this.settingsForm.addControl('baseUrl', new FormControl(this.serverSettings.baseUrl, [Validators.required]));
    });
  }

  resetForm() {
    this.settingsForm.get('cacheDirectory')?.setValue(this.serverSettings.cacheDirectory);
    this.settingsForm.get('bookmarksDirectory')?.setValue(this.serverSettings.bookmarksDirectory);
    this.settingsForm.get('scanTask')?.setValue(this.serverSettings.taskScan);
    this.settingsForm.get('taskBackup')?.setValue(this.serverSettings.taskBackup);
    this.settingsForm.get('port')?.setValue(this.serverSettings.port);
    this.settingsForm.get('loggingLevel')?.setValue(this.serverSettings.loggingLevel);
    this.settingsForm.get('allowStatCollection')?.setValue(this.serverSettings.allowStatCollection);
    this.settingsForm.get('enableOpds')?.setValue(this.serverSettings.enableOpds);
    this.settingsForm.get('enableAuthentication')?.setValue(this.serverSettings.enableAuthentication);
    this.settingsForm.get('baseUrl')?.setValue(this.serverSettings.baseUrl);
  }

  async saveSettings() {
    const modelSettings = this.settingsForm.value;

    if (this.settingsForm.get('enableAuthentication')?.dirty && this.settingsForm.get('enableAuthentication')?.value === false) {
      if (!await this.confirmService.confirm('Disabling Authentication opens your server up to unauthorized access and possible hacking. Are you sure you want to continue with this?')) {
        return;
      }
    }

    const informUserAfterAuthenticationEnabled = this.settingsForm.get('enableAuthentication')?.dirty && this.settingsForm.get('enableAuthentication')?.value && !this.serverSettings.enableAuthentication;

    this.settingsService.updateServerSettings(modelSettings).pipe(take(1)).subscribe(async (settings: ServerSettings) => {
      this.serverSettings = settings;
      this.resetForm();
      this.toastr.success('Server settings updated');

      if (informUserAfterAuthenticationEnabled) {
        await this.confirmService.alert('You have just re-enabled authentication. All non-admin users have been re-assigned a password of "[k.2@RZ!mxCQkJzE". This is a publicly known password. Please change their users passwords or request them to.');
      }
    }, (err: any) => {
      console.error('error: ', err);
    });
  }

  resetToDefaults() {
    this.settingsService.resetServerSettings().pipe(take(1)).subscribe(async (settings: ServerSettings) => {
      this.serverSettings = settings;
      this.resetForm();
      this.toastr.success('Server settings updated');
    }, (err: any) => {
      console.error('error: ', err);
    });
  }

  openDirectoryChooser(existingDirectory: string, formControl: string) {
    const modalRef = this.modalService.open(DirectoryPickerComponent, { scrollable: true, size: 'lg' });
    modalRef.componentInstance.startingFolder = existingDirectory || '';
    modalRef.componentInstance.helpUrl = '';
    modalRef.closed.subscribe((closeResult: DirectoryPickerResult) => {
      if (closeResult.success) {
        this.settingsForm.get(formControl)?.setValue(closeResult.folderPath);
        this.settingsForm.markAsTouched();
      }
    });
  }

}
