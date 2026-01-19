import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { getMDXComponents } from '../../../mdx-components'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props: PageProps) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  return metadata
}

type PageProps = {
  params: Promise<{
    mdxPath?: string[]
  }>
}

const mdxComponents = getMDXComponents()

export default async function Page(props: PageProps) {
  const params = await props.params
  const result = await importPage(params.mdxPath)
  const { default: MDXContent, toc, metadata } = result
  const Wrapper = mdxComponents.wrapper as React.ComponentType<{
    toc: typeof toc
    metadata: typeof metadata
    sourceCode?: string
    children: React.ReactNode
  }>

  return Wrapper ? (
    <Wrapper toc={toc} metadata={metadata} sourceCode="">
      <MDXContent {...props} params={params} />
    </Wrapper>
  ) : (
    <MDXContent {...props} params={params} />
  )
}
