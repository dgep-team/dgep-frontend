import { Screen } from '../components/layout/AppShell.jsx'
import { ScreenHeader } from '../components/layout/ScreenHeader.jsx'
import { ErrorView } from '../components/feedback/StatusView.jsx'

/** Stand-in for tabs that are designed but not built yet. */
export function PlaceholderPage({ title }) {
  return (
    <Screen width="narrow" header={<ScreenHeader title={title} backTo="/booking" />}>
      <ErrorView title={`${title} is coming soon`} message="This screen is not built yet." actionLabel="Back to booking" actionTo="/booking" />
    </Screen>
  )
}

export function NotFoundPage() {
  return (
    <Screen width="narrow" header={<ScreenHeader title="Not found" backTo="/booking" />}>
      <ErrorView title="Page not found" message="That link doesn’t lead anywhere." actionLabel="Back to booking" actionTo="/booking" />
    </Screen>
  )
}
