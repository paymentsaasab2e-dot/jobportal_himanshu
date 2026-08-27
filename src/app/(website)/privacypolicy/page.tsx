"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FBFD] text-slate-800">
      <section className="mx-auto max-w-[980px] px-6 pb-20 pt-32">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
            Legal
          </p>
          <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mb-8 text-sm font-medium text-slate-500">
            Last updated: August 27, 2026
          </p>

          <div className="space-y-8 text-[15px] leading-7 text-slate-700">
            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">1. Introduction</h2>
              <p>
                Hryantra (also referred to as &quot;HRYANTRA,&quot; &quot;we,&quot; &quot;us,&quot; or
                &quot;our&quot;) provides recruitment, job-search, candidate-management, employer CRM,
                interview scheduling, and related communication services through our websites and
                applications (collectively, the &quot;Service&quot;).
              </p>
              <p className="mt-2">
                This Privacy Policy explains how we access, use, store, protect, share, retain, and
                delete personal information, including Google user data obtained when a user
                connects a Google account to enable Gmail and Google Calendar features in the
                Service.
              </p>
              <p className="mt-2">
                By accessing or using the Service, you acknowledge that you have read and understood
                this Privacy Policy. If you do not agree, please do not use the Service or connect
                Google integrations.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">2. Information We Collect</h2>
              <p>Depending on how you use the Service, we may collect:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Name and contact details (such as email address and phone number)</li>
                <li>Account and profile information</li>
                <li>Resume/CV and related professional information that you upload or provide</li>
                <li>Job preferences and application activity</li>
                <li>Communication and notification settings</li>
                <li>Information you voluntarily provide (notes, messages, forms, and similar content)</li>
                <li>
                  OAuth account information when you connect third-party services (for Google, this
                  may include your Google account email, basic profile identifiers, granted scopes,
                  and OAuth tokens as described below)
                </li>
                <li>
                  Technical and security information such as device/browser metadata, IP address,
                  authentication cookies/tokens, and active-session records used to operate and
                  secure the Service
                </li>
              </ul>
              <p className="mt-2">
                We do not collect Google Gmail message bodies, headers, or attachments into a
                permanent Gmail message archive in our systems. Gmail content used for inbox and
                related features is retrieved from Google when needed to display or process a
                user-initiated action, as described in Section 3.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">
                3. Google OAuth and Google User Data
              </h2>
              <p>
                Users of the employer / recruitment workspace may optionally connect a Google
                account to enable Google-related functionality. Google user data is accessed only
                after the user authorizes the corresponding Google OAuth consent for the relevant
                integration.
              </p>
              <p className="mt-2">
                Based on our current implementation, the Service may request the following Google
                OAuth scopes (depending on which integration the user connects):
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <code className="rounded bg-slate-100 px-1 text-[13px]">openid</code>,{" "}
                  <code className="rounded bg-slate-100 px-1 text-[13px]">
                    userinfo.email
                  </code>
                  , and{" "}
                  <code className="rounded bg-slate-100 px-1 text-[13px]">
                    userinfo.profile
                  </code>{" "}
                  — to identify the connected Google account
                </li>
                <li>
                  <code className="rounded bg-slate-100 px-1 text-[13px]">
                    https://www.googleapis.com/auth/gmail.send
                  </code>{" "}
                  — to send email through the connected Gmail account
                </li>
                <li>
                  <code className="rounded bg-slate-100 px-1 text-[13px]">
                    https://www.googleapis.com/auth/gmail.readonly
                  </code>{" "}
                  — to read Gmail messages needed for inbox and related workflows
                </li>
                <li>
                  <code className="rounded bg-slate-100 px-1 text-[13px]">
                    https://www.googleapis.com/auth/calendar.events
                  </code>{" "}
                  — to create Google Calendar events (including Google Meet conference data where
                  enabled)
                </li>
              </ul>

              <h3 className="mb-2 mt-4 text-lg font-bold text-slate-900">3.1 Gmail data accessed</h3>
              <p>
                When a user connects Gmail and uses inbox or email features, the Service may access:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  Message list and metadata (including headers such as From, To, Subject, and Cc,
                  labels, and snippets) to display the user’s Gmail inbox inside Hryantra
                </li>
                <li>
                  Full message content (text and HTML body) when the user opens or acts on a
                  specific message
                </li>
                <li>
                  The ability to send email via the connected Gmail account for recruitment and
                  communication workflows initiated in the Service
                </li>
                <li>
                  Attachment presence indicators for display purposes. The Service does not
                  download or permanently store Gmail attachment files as part of the current Gmail
                  inbox implementation
                </li>
              </ul>
              <p className="mt-2">
                Gmail data is used to power in-product email inbox viewing, message handling, and
                sending recruitment-related communications through the user’s authorized Gmail
                account.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-bold text-slate-900">
                3.2 Google Calendar data accessed
              </h3>
              <p>
                When a user connects Google Calendar / Google Meet integrations, the Service may
                create events on the user’s primary Google Calendar. This may include event title,
                time, attendees, description, and Google Meet conference details where requested.
                In some workflows, a short excerpt of related Gmail message content may be included
                in the Calendar event description to help the user schedule from an email.
              </p>
              <p className="mt-2">
                Calendar data is used to schedule interviews and meetings and to generate Google Meet
                links associated with those events. The current implementation focuses on creating
                calendar events; it does not sync or permanently store a copy of the user’s full
                Google Calendar feed in Hryantra.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-bold text-slate-900">
                3.3 What we store related to Google
              </h3>
              <p>We store:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>OAuth access and refresh tokens needed to call Google APIs on the user’s behalf</li>
                <li>Connected Google account email and basic connection metadata (such as granted scopes)</li>
                <li>
                  Meeting links and related scheduling metadata created by the Service (for example,
                  a Google Meet URL saved on an interview or meeting record)
                </li>
              </ul>
              <p className="mt-2">
                We do not maintain a separate permanent archive of Gmail messages, Gmail headers, or
                Gmail attachments in our databases. Message content displayed in the inbox is
                retrieved from Google when needed.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">4. How We Use Google User Data</h2>
              <p>
                Google user data is used only to provide and operate the Google-connected features
                the user enables in Hryantra, including:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  Displaying and managing Gmail messages in the Hryantra inbox for recruitment
                  communication
                </li>
                <li>Sending emails through the user’s connected Gmail account when that feature is used</li>
                <li>
                  Creating Google Calendar events and Google Meet links for interview and meeting
                  scheduling
                </li>
                <li>
                  Maintaining the authenticated connection (tokens and account identifiers) so the
                  features continue to work until the user disconnects them
                </li>
              </ul>
              <p className="mt-2">
                We request only the Google permissions needed for these features. Based on our
                current product implementation, Google user data is{" "}
                <strong className="font-semibold text-slate-900">not</strong> used for:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Targeted advertising</li>
                <li>Selling Google user data</li>
                <li>Data brokerage</li>
                <li>Credit evaluation or lending decisions</li>
                <li>Advertising profiling</li>
                <li>Any purpose unrelated to providing or improving the Google-connected features of the Service</li>
              </ul>
              <p className="mt-2">
                Google user data is also not sent to third-party generative AI providers (such as
                OpenAI, Anthropic, or Gemini) as part of the current Gmail/Calendar integration
                flows.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">
                5. Google OAuth Tokens and Authentication Credentials
              </h2>
              <p>
                When you connect Google, we store OAuth access tokens and refresh tokens so the
                Service can call Google APIs on your behalf without asking you to sign in for every
                action.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong className="font-semibold text-slate-900">Where stored:</strong> in our
                  application databases (MongoDB) associated with your user account and tenant
                  workspace, including encrypted token fields on OAuth/integration connection
                  records
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Protection:</strong> OAuth access
                  and refresh token values are encrypted at rest using AES-256-GCM encryption before
                  storage. Access to the Service is protected by authentication controls and
                  role-based authorization within each workspace
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Retention:</strong> tokens are
                  retained while the Google integration remains connected and as needed to provide
                  the authorized features. There is currently no separate automatic timed purge of
                  Google OAuth tokens while a Google connection remains active
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Disconnect:</strong> users can
                  disconnect Google integrations from Communication / integration settings in the
                  employer workspace. Disconnecting removes the applicable OAuth integration
                  connection information and stops ongoing use of that Google integration for Gmail
                  or Calendar functionality. When no Google Gmail/Calendar/Meet integration remains
                  connected for the user, stored Google OAuth access and refresh tokens and related
                  Google connection fields are cleared from Hryantra
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Account deletion:</strong> when a
                  Hryantra user account record is deleted from our systems, related OAuth token and
                  integration connection records associated with that user are removed through our
                  database cascading deletion behavior
                </li>
              </ul>
            </section>

            <section id="google-user-data-sharing">
              <h2 className="mb-2 text-xl font-bold text-slate-900">
                6. Sharing, Transfer, and Disclosure of Google User Data
              </h2>
              <p>
                <strong className="font-semibold text-slate-900">
                  With whom Hryantra shares, transfers, or discloses Google user data:
                </strong>
              </p>
              <p className="mt-2">
                Hryantra does not sell Google user data and does not disclose Google user data to
                advertisers, data brokers, or other third parties for targeted advertising or
                unrelated commercial purposes.
              </p>
              <p className="mt-2">
                When a user authorizes Google services, Google user data may be transferred to or
                processed by the following recipients solely as necessary to provide the
                Google-connected functionality requested by the user:
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                  <strong className="font-semibold text-slate-900">Google / Google APIs:</strong>{' '}
                  Hryantra communicates with Google APIs, including the Gmail API and Google Calendar
                  API, using the user&apos;s authorized OAuth credentials. Google receives API
                  requests necessary to read Gmail messages, send Gmail messages, and create Google
                  Calendar events (including Google Meet conference data where enabled).
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">
                    Amazon Web Services (AWS):
                  </strong>{' '}
                  AWS provides cloud infrastructure used to operate Hryantra and may process
                  application data, including encrypted Google OAuth credentials and related
                  metadata, as necessary to host, operate, secure, and back up the Service.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">MongoDB / MongoDB Atlas:</strong>{' '}
                  MongoDB stores application data, including encrypted Google OAuth access and
                  refresh tokens, Google account connection metadata, and applicable meeting or
                  scheduling information created through the Google integration.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Redis:</strong> Where configured,
                  Redis may process temporary session, authentication, or OAuth-flow state required
                  to securely complete and operate the Google connection.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Vercel:</strong> Where used, Vercel
                  hosts and serves Hryantra application frontend resources. Vercel is not used by
                  Hryantra as a permanent archive of Gmail message content.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Other service providers:</strong>{' '}
                  Infrastructure, hosting, storage, security, and other providers may process Google
                  user data only when necessary to provide Hryantra functionality and subject to
                  applicable contractual, confidentiality, and security obligations.
                </li>
              </ul>
              <p className="mt-2">
                <strong className="font-semibold text-slate-900">
                  Providers that do not receive Gmail or Google Calendar user data under the current
                  Google integration:
                </strong>{' '}
                Hryantra does not transfer Gmail or Google Calendar data to generative AI providers
                such as OpenAI, Anthropic, or Google Gemini as part of the current Gmail and Calendar
                integration. Separately, when Gmail sending is not used, Hryantra may send
                application-composed transactional email through an email delivery provider (Resend);
                that path does not transfer the user&apos;s Gmail inbox contents to Resend.
              </p>
              <p className="mt-2">
                Hryantra may disclose Google user data if required by applicable law, legal process,
                or governmental request, or when reasonably necessary to protect the security,
                rights, or integrity of Hryantra, its users, or the public.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">
                7. Google API Services User Data Policy / Limited Use
              </h2>
              <p>
                Hryantra&apos;s use and transfer to any other app of information received from Google
                APIs will adhere to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  className="font-semibold text-sky-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
              <p className="mt-2">
                In practice, this means Google user data obtained through Google APIs is used to
                provide or improve user-facing features that are prominent in the Service’s user
                interface, is not sold, and is not used for serving advertisements, and human
                access is limited to cases such as providing support at a user’s request, security
                investigations, or complying with applicable law.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">8. Data Storage and Security</h2>
              <p>
                We implement technical and organizational measures appropriate to the nature of the
                data we process, including:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>User authentication and session management</li>
                <li>Role-based access controls within tenant workspaces</li>
                <li>Encryption in transit via HTTPS/TLS for application traffic</li>
                <li>AES-256-GCM encryption at rest for stored Google OAuth access and refresh tokens</li>
                <li>Secret/configuration management for encryption keys and API credentials</li>
                <li>
                  Storage of Google-related credentials and metadata in MongoDB associated with the
                  relevant user/tenant
                </li>
              </ul>
              <p className="mt-2">
                No method of transmission or storage is completely secure. We work to protect Google
                user data and other personal information, but we cannot guarantee absolute security.
              </p>
            </section>

            <section id="google-user-data-retention">
              <h2 className="mb-2 text-xl font-bold text-slate-900">
                9. Google User Data Retention
              </h2>
              <p>
                <strong className="font-semibold text-slate-900">
                  How long Hryantra retains Google user data:
                </strong>
              </p>
              <p className="mt-2">
                Hryantra retains Google user data only for as long as necessary to provide the
                Google-connected functionality requested by the user, maintain the authorized
                integration, comply with applicable legal requirements, or protect the security and
                integrity of the Service.
              </p>
              <p className="mt-2">
                The retention of each category of Google-related information is handled as follows:
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                  <strong className="font-semibold text-slate-900">
                    Google OAuth access tokens:
                  </strong>{' '}
                  Retained while the user&apos;s Google integration remains connected and while the
                  access token is necessary to provide authorized Google functionality. There is
                  currently no separate automatic timed purge of access tokens while a Google
                  connection remains active. Access tokens are cleared when the applicable Google
                  integration(s) are disconnected (and no Google Gmail/Calendar/Meet connection
                  remains), when the associated account/data is deleted, or when a verified deletion
                  request is completed, subject to applicable legal or security requirements.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">
                    Google OAuth refresh tokens:
                  </strong>{' '}
                  Retained while the user&apos;s Google integration remains connected and while the
                  refresh token is necessary to renew access for authorized Google functionality.
                  There is currently no separate automatic timed purge of refresh tokens while a
                  Google connection remains active. Refresh tokens are cleared under the same
                  disconnect, account-deletion, and verified deletion-request conditions described
                  for access tokens.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">
                    Google account email / connection metadata:
                  </strong>{' '}
                  The Google account email address, granted scopes, connection status, and related
                  integration metadata are retained while the Google integration is active and until
                  they are no longer necessary, the integration is disconnected, the account is
                  deleted, or deletion is requested.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Gmail message content:</strong>{' '}
                  Hryantra does not maintain a permanent archive of Gmail messages. Gmail message
                  content (including headers/metadata and message body content retrieved for inbox
                  features) is retrieved from Google when needed to provide an authorized inbox or
                  email feature and is not retained as a permanent Gmail message archive in
                  Hryantra.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Gmail attachments:</strong>{' '}
                  Hryantra does not permanently store Gmail attachment files as part of the current
                  Gmail inbox implementation.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">
                    Google Calendar information:
                  </strong>{' '}
                  Hryantra does not sync or permanently store a copy of the user&apos;s full Google
                  Calendar feed. Calendar events created through Hryantra may result in meeting links
                  and related scheduling information being stored in Hryantra records.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">
                    Meeting / Google Meet links and scheduling metadata:
                  </strong>{' '}
                  Meeting links and related scheduling metadata created by Hryantra are retained
                  according to the retention of the associated Hryantra interview/meeting or
                  workspace record.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">
                    Security / operational logs:
                  </strong>{' '}
                  Authentication, security, and operational logs may be retained for as long as
                  reasonably necessary for security, troubleshooting, fraud prevention, and
                  operation of the Service.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Backups:</strong> Google-related
                  information contained in backups may remain temporarily until the applicable
                  backup is automatically overwritten or deleted according to Hryantra&apos;s normal
                  backup-retention process.
                </li>
              </ul>
              <p className="mt-2">
                While a Google integration remains actively connected, Hryantra does not apply a
                separate fixed-day automatic purge timer to OAuth credentials. When Google user data
                is no longer required for the authorized functionality, or when a verified deletion
                request is completed, eligible Google user data is deleted in accordance with
                Hryantra&apos;s deletion procedures described in Section 10.
              </p>
            </section>

            <section id="google-user-data-deletion">
              <h2 className="mb-2 text-xl font-bold text-slate-900">
                10. Google User Data Deletion
              </h2>
              <p>
                <strong className="font-semibold text-slate-900">
                  How to request deletion of Google user data:
                </strong>
              </p>
              <p className="mt-2">
                Users may request deletion of Google user data held by Hryantra by contacting{' '}
                <a
                  href="mailto:privacy@hryantra.com"
                  className="font-semibold text-sky-600 hover:underline"
                >
                  privacy@hryantra.com
                </a>{' '}
                and identifying their Hryantra account and Google connection.
              </p>
              <p className="mt-2">
                Upon receiving and verifying a deletion request, Hryantra will process the request
                without undue delay and delete eligible Google user data in accordance with its
                data-deletion procedures, subject to applicable legal, security, and backup-retention
                requirements. Eligible stored Google user data that Hryantra may delete includes
                Google OAuth access and refresh tokens, Google account/connection metadata, and other
                Google-related information that Hryantra actually stores and that is no longer
                required for an authorized service.
              </p>
              <p className="mt-2">
                <strong className="font-semibold text-slate-900">
                  What happens to Gmail content that is not permanently stored:
                </strong>{' '}
                Because Hryantra does not maintain a permanent archive of Gmail message content,
                there is no permanent Gmail message archive in Hryantra that must be separately
                deleted. Gmail content retrieved from Google for an authorized feature remains under
                Google&apos;s control and is not retained by Hryantra as a permanent Gmail archive.
              </p>
              <p className="mt-2">
                <strong className="font-semibold text-slate-900">
                  What happens to Google Calendar / Meet metadata stored in Hryantra:
                </strong>{' '}
                Meeting links and related scheduling metadata stored on Hryantra interview/meeting
                records may be deleted when the associated Hryantra record is deleted, when a
                verified deletion request covering that information is completed, or otherwise as
                required by Hryantra&apos;s account/data deletion procedures.
              </p>
              <p className="mt-2">
                <strong className="font-semibold text-slate-900">
                  What happens when Google is disconnected:
                </strong>{' '}
                When a user disconnects Google, Hryantra stops using the Google integration for
                ongoing Gmail and Calendar functionality and removes the applicable OAuth
                integration connection information according to its deletion procedures. When no
                Google Gmail/Calendar/Meet integration remains connected for the user, stored Google
                OAuth credentials and related Google connection fields are cleared from Hryantra.
              </p>
              <p className="mt-2">
                <strong className="font-semibold text-slate-900">
                  What happens when a Hryantra account is deleted:
                </strong>{' '}
                When a Hryantra account is deleted, associated Google OAuth credentials and Google
                integration records are removed through Hryantra&apos;s account/data deletion
                process, subject to applicable legal, security, dispute-resolution, or other
                legitimate retention requirements.
              </p>
              <p className="mt-2">
                <strong className="font-semibold text-slate-900">What happens to backups:</strong>{' '}
                Google-related information contained in backups may remain temporarily until the
                applicable backup is automatically overwritten or deleted according to Hryantra&apos;s
                normal backup-retention process.
              </p>
              <p className="mt-2">
                <strong className="font-semibold text-slate-900">
                  Legal / security exceptions:
                </strong>{' '}
                Where information is required to be retained by law or is reasonably necessary to
                protect security, prevent fraud, resolve disputes, or enforce agreements, Hryantra
                may retain the minimum information necessary for that purpose.
              </p>
              <p className="mt-2">
                Users may also revoke Hryantra&apos;s access to their Google account directly through
                their Google Account permissions at{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  className="font-semibold text-sky-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://myaccount.google.com/permissions
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">11. Disconnecting Google</h2>
              <p>
                Authorized users can disconnect Google integrations (including Gmail, Google
                Calendar, and Google Meet) from Communication / integration settings in the
                Hryantra employer workspace.
              </p>
              <p className="mt-2">
                When a user disconnects Google, Hryantra stops using the Google integration for
                ongoing Gmail and Calendar functionality and removes the applicable OAuth
                integration connection information according to its deletion procedures. When no
                Google Gmail/Calendar/Meet integration remains connected for the user, stored Google
                OAuth access and refresh tokens and related Google connection fields are cleared
                from Hryantra.
              </p>
              <p className="mt-2">
                If you cannot access the disconnect controls, or you want confirmation that Google
                credentials have been removed, contact{' '}
                <a
                  href="mailto:privacy@hryantra.com"
                  className="font-semibold text-sky-600 hover:underline"
                >
                  privacy@hryantra.com
                </a>
                . Users may also revoke Hryantra&apos;s Google access through their Google Account
                permissions at{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  className="font-semibold text-sky-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://myaccount.google.com/permissions
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">12. Other OAuth Providers</h2>
              <p>
                Depending on your workspace configuration, the Service may also support connecting
                other providers, including Microsoft (Outlook / Teams), LinkedIn, Zoom, Twitter/X,
                and Facebook. When connected, we store the minimum required OAuth tokens and account
                metadata needed to support the corresponding messaging, meeting, publishing, or
                status features.
              </p>
              <p className="mt-2">
                Those integrations are separate from Google user data. Tokens and account metadata
                for other providers are stored to keep the connection working until you disconnect
                them or your account is deleted.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">
                13. Cookies and Technical Information
              </h2>
              <p>
                The Service uses cookies and similar technologies that are necessary to operate
                authenticated sessions. This may include authentication access/refresh tokens and
                tenant workspace identifiers stored in cookies and/or local browser storage so you
                can remain signed in and access the correct workspace.
              </p>
              <p className="mt-2">
                We also maintain active-session records (such as device/browser metadata and related
                security information) to help secure accounts. The employer product does not
                currently rely on third-party advertising analytics SDKs (such as Google Analytics
                advertising tags or Mixpanel) to process Google user data.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">14. User Rights and Controls</h2>
              <p>Subject to your account type and workspace permissions, you may:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Update certain account and profile information in the Service</li>
                <li>Disconnect Google and other integrations from integration settings</li>
                <li>
                  Request access to, correction of, or deletion of personal information we hold,
                  including Google-related credentials and connection metadata, by contacting
                  privacy@hryantra.com
                </li>
                <li>Revoke Google access from your Google Account permissions page</li>
              </ul>
              <p className="mt-2">
                We will respond to privacy requests using the contact channels below. Some requests
                may require identity verification and may be limited by law or the rights of other
                users/tenants.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">15. Children&apos;s Privacy</h2>
              <p>
                The Service is directed to professionals and organizations for recruitment and
                employment-related use. It is not directed to children. Consistent with our
                candidate profile requirements, users providing date-of-birth information are
                expected to be at least 18 years of age. We do not knowingly collect personal
                information from children under 18. If you believe a child has provided personal
                information to us, contact privacy@hryantra.com and we will take appropriate steps
                to delete it.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">
                16. Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. When we do, we will revise the
                &quot;Last updated&quot; date at the top of this page. For material changes, we will
                provide additional notice as required by applicable law or as otherwise appropriate
                (for example, through the Service or by email).
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">17. Contact Us</h2>
              <p>
                <strong className="font-semibold text-slate-900">Hryantra</strong>
              </p>
              <p className="mt-2">
                Privacy inquiries:{" "}
                <a
                  href="mailto:privacy@hryantra.com"
                  className="font-semibold text-sky-600 hover:underline"
                >
                  privacy@hryantra.com
                </a>
              </p>
              <p className="mt-2">
                Privacy Policy:{" "}
                <a
                  href="https://www.hryantra.com/en/privacypolicy"
                  className="font-semibold text-sky-600 hover:underline"
                >
                  https://www.hryantra.com/en/privacypolicy
                </a>
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
