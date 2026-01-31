import React from 'react'

export const ShieldIcon = ({
	className = 'w-6 h-6',
}: {
	className?: string
}) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
		/>
	</svg>
)

export const LockIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
		/>
	</svg>
)

export const EyeIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
		/>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
		/>
	</svg>
)

export const CheckIcon = ({
	className = 'w-6 h-6',
}: {
	className?: string
}) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M5 13l4 4L19 7'
		/>
	</svg>
)

export const UploadIcon = ({
	className = 'w-6 h-6',
}: {
	className?: string
}) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
		/>
	</svg>
)

export const HistoryIcon = ({
	className = 'w-6 h-6',
}: {
	className?: string
}) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
		/>
	</svg>
)

export const DatabaseIcon = ({
	className = 'w-6 h-6',
}: {
	className?: string
}) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4'
		/>
	</svg>
)

export const KeyIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
		/>
	</svg>
)

export const AlertTriangleIcon = ({
	className = 'w-6 h-6',
}: {
	className?: string
}) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
		/>
	</svg>
)

export const ChatIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
		/>
	</svg>
)

// Activity icon for lab results / blood work
export const ActivityIcon = ({
	className = 'w-6 h-6',
}: {
	className?: string
}) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M22 12h-4l-3 9L9 3l-3 9H2'
		/>
	</svg>
)

// Alert circle icon for allergies / warnings
export const AlertCircleIcon = ({
	className = 'w-6 h-6',
}: {
	className?: string
}) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<circle cx='12' cy='12' r='10' strokeWidth={2} />
		<line x1='12' y1='8' x2='12' y2='12' strokeWidth={2} strokeLinecap='round' />
		<line x1='12' y1='16' x2='12.01' y2='16' strokeWidth={2} strokeLinecap='round' />
	</svg>
)

// Pill icon for medications / prescriptions
export const PillIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M10.5 3.5a6.5 6.5 0 0 1 9.193 9.193l-6.364 6.364a6.5 6.5 0 0 1-9.193-9.193l6.364-6.364z'
		/>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M7.757 16.243l8.486-8.486'
		/>
	</svg>
)

// Scan / X-Ray icon for imaging
export const ScanIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			d='M4 8V4h4M4 16v4h4M16 4h4v4M16 20h4v-4'
		/>
		<rect
			x='9'
			y='9'
			width='6'
			height='6'
			rx='1'
			strokeWidth={2}
		/>
	</svg>
)

// Info icon for encryption/security notices
export const InfoIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<circle cx='12' cy='12' r='10' strokeWidth={2} />
		<line x1='12' y1='16' x2='12' y2='12' strokeWidth={2} strokeLinecap='round' />
		<line x1='12' y1='8' x2='12.01' y2='8' strokeWidth={2} strokeLinecap='round' />
	</svg>
)

// Clock icon for pending status
export const ClockIcon = ({
	className = 'w-6 h-6',
}: {
	className?: string
}) => (
	<svg
		className={className}
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
	>
		<circle cx='12' cy='12' r='10' strokeWidth={2} />
		<polyline points='12 6 12 12 16 14' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
	</svg>
)
