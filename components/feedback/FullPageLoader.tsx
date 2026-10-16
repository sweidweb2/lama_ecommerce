'use client'

import { DNA } from 'react-loader-spinner'

export function FullPageLoader() {
    return (
        <div className="flex min-h-[calc(100svh-8rem)] w-full flex-1 items-center justify-center self-stretch">
            <DNA
                visible={true}
                height="220"
                width="220"
                ariaLabel="dna-loading"
                dnaColorOne="#594C39"
                dnaColorTwo="#847562"
            />
        </div>
    )
}
