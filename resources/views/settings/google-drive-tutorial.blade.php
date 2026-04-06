<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Drive Backup Setup Guide — HR Leave System</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f3f4f6;
            color: #1f2937;
            line-height: 1.6;
            padding: 2rem 1rem;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }

        /* Header / Branding */
        .header {
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            padding: 2.5rem 2.5rem 2rem;
            color: #ffffff;
        }

        .header-brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }

        .header-logo {
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            font-weight: 700;
        }

        .header-brand-name {
            font-size: 1rem;
            font-weight: 600;
            opacity: 0.9;
        }

        .header h1 {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .header p {
            opacity: 0.85;
            font-size: 0.95rem;
        }

        /* Action buttons */
        .action-bar {
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            padding: 1rem 2.5rem;
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1.25rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: opacity 0.15s;
        }

        .btn:hover {
            opacity: 0.85;
        }

        .btn-primary {
            background: #4F46E5;
            color: #ffffff;
        }

        .btn-youtube {
            background: #DC2626;
            color: #ffffff;
        }

        .btn-back {
            background: #ffffff;
            color: #374151;
            border: 1px solid #d1d5db;
        }

        /* Content */
        .content {
            padding: 2.5rem;
        }

        .intro {
            background: #EEF2FF;
            border-left: 4px solid #4F46E5;
            padding: 1rem 1.25rem;
            border-radius: 0 8px 8px 0;
            margin-bottom: 2rem;
            font-size: 0.9rem;
            color: #3730a3;
        }

        /* Steps */
        .steps {
            counter-reset: step-counter;
        }

        .step {
            display: flex;
            gap: 1.25rem;
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid #f3f4f6;
        }

        .step:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }

        .step-number {
            flex-shrink: 0;
            width: 36px;
            height: 36px;
            background: #4F46E5;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.875rem;
            margin-top: 0.1rem;
        }

        .step-body {
            flex: 1;
        }

        .step-body h3 {
            font-size: 1rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 0.4rem;
        }

        .step-body p {
            font-size: 0.875rem;
            color: #4b5563;
            line-height: 1.65;
        }

        .step-body .tip {
            margin-top: 0.6rem;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 0.6rem 0.875rem;
            font-size: 0.8rem;
            color: #6b7280;
            font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
            word-break: break-all;
        }

        .step-body .note {
            margin-top: 0.6rem;
            background: #FFFBEB;
            border: 1px solid #FDE68A;
            border-radius: 6px;
            padding: 0.6rem 0.875rem;
            font-size: 0.8rem;
            color: #92400e;
        }

        /* Section divider */
        .section-title {
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #9ca3af;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #f3f4f6;
        }

        /* YouTube section */
        .youtube-section {
            margin-top: 2.5rem;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
        }

        .youtube-section h3 {
            font-size: 1.1rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 0.5rem;
        }

        .youtube-section p {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 1.25rem;
        }

        .youtube-placeholder {
            background: #1f2937;
            border-radius: 8px;
            height: 200px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            margin-bottom: 1.25rem;
        }

        .youtube-play-icon {
            width: 56px;
            height: 56px;
            background: #DC2626;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .youtube-play-icon svg {
            width: 24px;
            height: 24px;
            fill: #ffffff;
            margin-left: 3px;
        }

        .youtube-placeholder-text {
            color: #9ca3af;
            font-size: 0.875rem;
        }

        /* Footer */
        .footer {
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            padding: 1.25rem 2.5rem;
            font-size: 0.8rem;
            color: #9ca3af;
            text-align: center;
        }

        /* Print styles */
        @media print {
            body {
                background: #ffffff;
                padding: 0;
            }

            .container {
                border-radius: 0;
                box-shadow: none;
            }

            .action-bar {
                display: none !important;
            }

            .youtube-section .btn,
            .youtube-section .btn-youtube {
                display: none !important;
            }

            .youtube-placeholder {
                border: 2px dashed #d1d5db;
                background: #f9fafb;
                height: 100px;
            }

            .youtube-play-icon {
                display: none;
            }

            .youtube-placeholder-text {
                color: #6b7280;
            }

            .step {
                page-break-inside: avoid;
            }

            .header {
                background: #4F46E5 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .step-number {
                background: #4F46E5 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }

        @media (max-width: 600px) {
            .content {
                padding: 1.5rem;
            }

            .header {
                padding: 1.75rem 1.5rem 1.5rem;
            }

            .action-bar {
                padding: 0.875rem 1.5rem;
            }

            .header h1 {
                font-size: 1.4rem;
            }

            .footer {
                padding: 1rem 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">

        <!-- Header / Branding -->
        <div class="header">
            <div class="header-brand">
                <div class="header-logo">HR</div>
                <span class="header-brand-name">HR Leave System</span>
            </div>
            <h1>Google Drive Backup Setup Guide</h1>
            <p>Step-by-step instructions to connect your Google Drive for automatic database backups.</p>
        </div>

        <!-- Action Bar (hidden on print) -->
        <div class="action-bar">
            <button class="btn btn-primary" onclick="window.print()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print / Save as PDF
            </button>
            <a href="#placeholderyoutubetutorial" class="btn btn-youtube">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                Watch Video Tutorial
            </a>
            <a href="/settings/scheduled-tasks" class="btn btn-back">
                &larr; Back to Settings
            </a>
        </div>

        <!-- Main Content -->
        <div class="content">

            <p class="intro">
                This guide will walk you through creating a Google Cloud project, enabling the Drive API, and connecting it to your HR Leave System so backups are automatically uploaded to your Google Drive.
            </p>

            <p class="section-title">Setup Instructions</p>

            <div class="steps">

                <!-- Step 1 -->
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-body">
                        <h3>Go to Google Cloud Console</h3>
                        <p>Open your browser and navigate to the Google Cloud Console at <strong>console.cloud.google.com</strong>. Sign in with the Google account you want to use for storing backups — this will be the Google Drive where backup files are saved.</p>
                        <div class="tip">https://console.cloud.google.com</div>
                    </div>
                </div>

                <!-- Step 2 -->
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-body">
                        <h3>Create a New Project</h3>
                        <p>In the top navigation bar, click on the project selector dropdown (next to the Google Cloud logo). Click <strong>"New Project"</strong>, give it a descriptive name such as <em>"HR Leave Backup"</em>, and click <strong>Create</strong>. Wait a moment for the project to be provisioned, then make sure it is selected as your active project.</p>
                    </div>
                </div>

                <!-- Step 3 -->
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-body">
                        <h3>Enable the Google Drive API</h3>
                        <p>In the left sidebar, navigate to <strong>APIs &amp; Services &gt; Library</strong>. Use the search bar to find <em>"Google Drive API"</em>. Click on it from the results, then click the blue <strong>Enable</strong> button. This grants your project permission to access Google Drive on behalf of users.</p>
                    </div>
                </div>

                <!-- Step 4 -->
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-body">
                        <h3>Configure the OAuth Consent Screen</h3>
                        <p>Go to <strong>APIs &amp; Services &gt; OAuth consent screen</strong>. Select <strong>External</strong> as the user type and click Create. Fill in the required fields: App name (e.g. "HR Leave Backup"), user support email, and developer contact email. On the <strong>Scopes</strong> step, add the scope <code>.../auth/drive.file</code> (this limits access to only files the app creates). On the <strong>Test users</strong> step, add your Google account email address so you can authorize during testing. Save and continue through each step.</p>
                        <div class="note">Note: While in "Testing" mode, only the listed test users can authorize. This is fine for a private deployment used by a single super admin.</div>
                    </div>
                </div>

                <!-- Step 5 -->
                <div class="step">
                    <div class="step-number">5</div>
                    <div class="step-body">
                        <h3>Create OAuth 2.0 Credentials</h3>
                        <p>Go to <strong>APIs &amp; Services &gt; Credentials</strong>. Click <strong>+ Create Credentials</strong> and select <strong>OAuth 2.0 Client ID</strong>. Choose <strong>Web application</strong> as the application type and give it a name (e.g. "HR Leave Web Client").</p>
                    </div>
                </div>

                <!-- Step 6 -->
                <div class="step">
                    <div class="step-number">6</div>
                    <div class="step-body">
                        <h3>Set the Authorized Redirect URI</h3>
                        <p>While creating the OAuth Client ID (from Step 5), scroll down to the <strong>Authorized redirect URIs</strong> section. Click <strong>+ Add URI</strong> and enter the exact callback URL for your HR Leave System installation. Replace <code>your-domain.com</code> with your actual domain.</p>
                        <div class="tip">https://your-domain.com/settings/google-drive/callback</div>
                        <div class="note">This URI must match exactly — including the protocol (https), domain, and path. Any mismatch will result in an authorization error.</div>
                    </div>
                </div>

                <!-- Step 7 -->
                <div class="step">
                    <div class="step-number">7</div>
                    <div class="step-body">
                        <h3>Copy Your Client ID and Client Secret</h3>
                        <p>After creating the OAuth Client ID, a dialog will appear showing your <strong>Client ID</strong> and <strong>Client Secret</strong>. Copy both values and keep them safe. You can also access them later by clicking the edit (pencil) icon next to your credential in the Credentials list. Do not share these values publicly.</p>
                    </div>
                </div>

                <!-- Step 8 -->
                <div class="step">
                    <div class="step-number">8</div>
                    <div class="step-body">
                        <h3>Paste Credentials into HR Leave System</h3>
                        <p>Go to <strong>Settings &gt; Scheduled Tasks</strong> in your HR Leave System. Scroll to the <em>Google Drive Backup</em> section, enable the toggle, and paste your <strong>Client ID</strong> and <strong>Client Secret</strong> into the respective fields. Optionally, enter a Google Drive <strong>Folder ID</strong> if you want backups saved to a specific folder (leave empty to save to the root of Drive). Click <strong>Save Settings</strong>.</p>
                    </div>
                </div>

                <!-- Step 9 -->
                <div class="step">
                    <div class="step-number">9</div>
                    <div class="step-body">
                        <h3>Connect Your Google Drive Account</h3>
                        <p>After saving your credentials, a <strong>"Connect Google Drive"</strong> button will appear. Click it — you will be redirected to Google's authorization page. Select or sign in with the Google account whose Drive you want to use. Review the permissions requested (only Drive file access) and click <strong>Allow</strong>. You will be redirected back to the settings page.</p>
                    </div>
                </div>

                <!-- Step 10 -->
                <div class="step">
                    <div class="step-number">10</div>
                    <div class="step-body">
                        <h3>Verify the Connection</h3>
                        <p>After authorizing, the settings page should show a green <strong>"Connected as [your email]"</strong> badge in the Google Drive section. This confirms that the authorization was successful and the system has a valid refresh token stored to upload backups on your behalf.</p>
                    </div>
                </div>

                <!-- Step 11 -->
                <div class="step">
                    <div class="step-number">11</div>
                    <div class="step-body">
                        <h3>Enable Google Drive Backup and Save</h3>
                        <p>Ensure the <strong>"Backup to Google Drive"</strong> toggle is enabled in the settings form. Click <strong>Save Settings</strong> to persist the setting. From this point, every automatic backup (or manual "Run Backup Now") will upload the generated zip file to your connected Google Drive account. You can verify by checking your Google Drive for files named <code>backup-YYYY-MM-DD-HH-II-SS.zip</code>.</p>
                        <div class="note">Tip: You can create a dedicated folder in Google Drive named "HR Backups" and paste that folder's ID (from the URL when viewing the folder) into the Drive Folder ID field to keep backups organized.</div>
                    </div>
                </div>

            </div>

            <!-- YouTube Section -->
            <div class="youtube-section" id="placeholderyoutubetutorial">
                <h3>Video Tutorial</h3>
                <p>Watch a step-by-step walkthrough of the entire setup process on YouTube.</p>

                <div class="youtube-placeholder">
                    <div class="youtube-play-icon">
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <span class="youtube-placeholder-text">Tutorial video coming soon</span>
                </div>

                <a href="#placeholderyoutubetutorial" class="btn btn-youtube">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                    Watch Tutorial on YouTube
                </a>
            </div>

        </div>

        <!-- Footer -->
        <div class="footer">
            HR Leave System &mdash; Google Drive Backup Setup Guide &mdash; Generated {{ now()->format('d M Y') }}
        </div>

    </div>
</body>
</html>
