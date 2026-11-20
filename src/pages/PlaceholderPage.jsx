import { Screen } from '../components/layout/AppShell.jsx'
import { ScreenHeader } from '../components/layout/ScreenHeader.jsx'
import { ErrorView } from '../components/feedback/StatusView.jsx'

/** Stand-in for tabs that are designed but not built yet. */
export function PlaceholderPage({ title }) {
  return (
    <Screen width="narrow" header={<ScreenHeader title={title} backTo="/home" />}>
      <ErrorView title={`${title} is coming soon`} message="This screen is not built yet." actionLabel="Go home" actionTo="/home" />
    </Screen>
  )
}

export function NotFoundPage() {
  return (
    <Screen width="narrow" header={<ScreenHeader title="Not found" backTo="/home" />}>
      <ErrorView title="Page not found" message="That link doesn’t lead anywhere." actionLabel="Go home" actionTo="/home" />
    </Screen>
  )
}
