import { DNA } from 'react-loader-spinner'
import React from 'react'
import dynamic from 'next/dynamic'

export function FullPageLoader() {
    return (

        <div className="flex items-center justify-center h-screen w-screen">
            <div className="w-full h-full">
                <DNA
                    visible={true}
                    height="100%"
                    width="100%"
                    ariaLabel="dna-loading"
                    wrapperStyle={{}}
                    wrapperClass="w-full h-full"
                />
            </div>
        </div>
    )
}